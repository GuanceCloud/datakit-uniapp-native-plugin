import {
	rum as gcRum
} from '@/uni_modules/GC-UniPlugin';

// `vdSync` is the App-Harmony renderer-to-service event channel. A template
// event is represented by action type 20 before UniApp dispatches it to the
// application-level `@click` handler.
const VD_SYNC_EVENT = 'vdSync';
const INVOKE_SERVICE_API_EVENT = 'invokeServiceApi';
const VDOM_EVENT_ACTION = 20;
const TRACKED_EVENT_TYPES = ['click', 'tap', 'longpress', 'longtap'];
const ROUTE_API_NAMES = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab', 'navigateBack'];

// The Harmony view runtime serializes template events as `onClick`, `onTap`,
// etc. It also appends listener modifiers, for example `onClickOnce`.
// Normalize that wire-format value before matching it against our event list.
export function normalizeUniAppEventType(type) {
	if (typeof type !== 'string' || !type) {
		return '';
	}

	const eventName = type
		.replace(/^on/, '')
		.replace(/(?:Once|Passive|Capture)+$/, '');
	if (!eventName) {
		return '';
	}

	return eventName.charAt(0).toLowerCase() + eventName.slice(1)
		.replace(/([A-Z])/g, '-$1').toLowerCase();
}

class ActionMonitor {
	constructor() {
		this.initialized = false;
		this.tabSwitchInterceptorInstalled = false;
		this.actionTrackingHandler = null;
		this.retryTimer = null;
		this.retryAttempts = 0;
		this.lastTabSwitch = {
			path: '',
			timestamp: 0
		};
		this.rum = gcRum;
		this.handleVdSync = this.handleVdSync.bind(this);
		this.handleServiceAPI = this.handleServiceAPI.bind(this);
	}

	startTracking() {
		if (this.initialized) {
			return;
		}

		// #ifdef APP-HARMONY
		this.installTabSwitchInterceptor();
		const bridge = this.getHarmonyBridge();
		if (!bridge || typeof bridge.subscribe !== 'function') {
			this.scheduleStartTracking();
			return;
		}

		// startTracking() runs while createApp() is being constructed, before the
		// runtime installs its own vdSync dispatcher. This makes collection happen
		// once per source event, before the application's event handler runs.
		bridge.subscribe(VD_SYNC_EVENT, this.handleVdSync);
		// `<navigator>` invokes route APIs from the Harmony View runtime instead
		// of emitting a service-side `vdSync` event. Subscribe to that native
		// bridge call so its tap is collected as an Action too.
		bridge.subscribe(INVOKE_SERVICE_API_EVENT, this.handleServiceAPI);
		this.initialized = true;
		this.retryAttempts = 0;
		console.log('[FTLog] UniApp JS Action tracking initialized');
		// #endif
	}

	scheduleStartTracking() {
		if (this.retryTimer !== null || this.retryAttempts >= 20 || typeof setTimeout !== 'function') {
			if (this.retryAttempts >= 20) {
				console.warn('[FTLog] UniApp JS Action bridge is unavailable; JS Action collection is disabled');
			}
			return;
		}

		this.retryAttempts += 1;
		this.retryTimer = setTimeout(() => {
			this.retryTimer = null;
			this.startTracking();
		}, 50);
	}

	getHarmonyBridge() {
		if (typeof globalThis === 'undefined') {
			return null;
		}
		return globalThis.UniServiceJSBridge || null;
	}

	// This has the same callback shape as the native FTActionTrackingHandler:
	// `resolveHandlerAction(wrapper)` may return a HandlerAction-like object
	// (`getActionName` / `getProperty`) or a plain `{ actionName, property }`.
	// Returning null skips the Action, matching the native SDK contract.
	setActionTrackingHandler(handler) {
		this.actionTrackingHandler = handler &&
			(typeof handler === 'function' || typeof handler.resolveHandlerAction === 'function') ?
			handler : null;
	}

	handleVdSync(actions, pageId) {
		if (!Array.isArray(actions)) {
			return;
		}

		actions.forEach((action) => {
			if (!Array.isArray(action) || action[0] !== VDOM_EVENT_ACTION) {
				return;
			}

			const event = action[2];
			const eventType = normalizeUniAppEventType(event && event.type);
			if (TRACKED_EVENT_TYPES.indexOf(eventType) === -1) {
				return;
			}

			this.trackAction({
				eventType,
				nodeId: action[1],
				pageId,
				event
			});
		});
	}

	handleServiceAPI(payload, pageId) {
		if (!payload || ROUTE_API_NAMES.indexOf(payload.name) === -1) {
			return;
		}

		const args = payload.args || {};
		const isTabSwitch = payload.name === 'switchTab';
		if (isTabSwitch) {
			this.trackTabSwitch(args.url, pageId);
			return;
		}

		const page = this.getPage(pageId);
		const node = this.findNavigatorNode(page && (page.__page_container__ ||
			(page.$vm && page.$vm.__page_container__)), args.url);
		const property = {
			action_source: 'uniapp_js_navigator',
			action_route_api: payload.name,
			action_route_url: args.url || ''
		};
		this.trackAction({
			eventType: 'click',
			nodeId: node && node.nodeId,
			pageId,
			operationName: node ? null : payload.name,
			property
		});
	}

	installTabSwitchInterceptor() {
		if (this.tabSwitchInterceptorInstalled || typeof uni === 'undefined' ||
			!uni || typeof uni.addInterceptor !== 'function') {
			return;
		}

		uni.addInterceptor('switchTab', {
			invoke: (options) => {
				if (options && options.from === 'tabBar') {
					this.trackTabSwitch(options.url);
				}
			}
		});
		this.tabSwitchInterceptorInstalled = true;
	}

	trackTabSwitch(url, pageId) {
		const tab = this.getTabBarItem(url);
		const targetPagePath = this.normalizeRoutePath((tab && tab.pagePath) || url);
		if (!targetPagePath || this.isDuplicateTabSwitch(targetPagePath)) {
			return;
		}

		const tabText = tab && typeof tab.text === 'string' ? tab.text : '';
		const actionPageId = pageId !== undefined && pageId !== null ? pageId : this.getActivePageId();
		const currentPagePath = this.getPagePath(actionPageId);
		const sourcePagePath = currentPagePath ? currentPagePath.split('?')[0] : '';
		const property = {
			action_source: 'uniapp_js_tabbar',
			action_route_api: 'switchTab',
			action_route_url: '/' + targetPagePath,
			action_page_path: targetPagePath,
			action_target_page_path: targetPagePath
		};
		if (sourcePagePath) {
			property.action_source_page_path = sourcePagePath;
		}
		if (tabText) {
			property.action_tab_text = tabText;
		}
		if (tab && typeof tab.index === 'number') {
			property.action_tab_index = String(tab.index);
		}

		this.trackAction({
			eventType: 'click',
			pageId: actionPageId,
			operationName: this.getTabActionName(tabText, tab && tab.index),
			property
		});
	}

	isDuplicateTabSwitch(targetPagePath) {
		const now = Date.now();
		const isDuplicate = this.lastTabSwitch.path === targetPagePath &&
			now - this.lastTabSwitch.timestamp < 500;
		this.lastTabSwitch = {
			path: targetPagePath,
			timestamp: now
		};
		return isDuplicate;
	}

	trackAction({
		eventType,
		nodeId,
		pageId,
		event,
		operationName = null,
		property = null
	}) {
		try {
			const pagePath = this.getPagePath(pageId);
			const viewName = pagePath ? pagePath.split('?')[0] : 'unknown_view';
			const node = this.getActionNode(pageId, nodeId);
			const handlerAction = this.resolveHandlerAction({
				node,
				pageId,
				pagePath: viewName,
				event,
				eventType,
				property
			});
			if (handlerAction.skip) {
				return;
			}
			const defaultAction = this.getDefaultActionName({
				node,
				pageId,
				nodeId,
				event,
				eventType
			});
			const actionName = handlerAction.actionName || operationName || defaultAction.actionName;
			if (!this.isValidOperationName(actionName)) {
				return;
			}
			const actionProperty = {
				action_source: 'uniapp_js_event',
				action_event_type: eventType,
				action_page_path: viewName,
				...(property || {}),
				...(handlerAction.property || {})
			};
			if (defaultAction.position !== null) {
				actionProperty.action_position = defaultAction.position;
			}
			if (pageId !== undefined && pageId !== null) {
				actionProperty.action_page_id = String(pageId);
			}
			if (nodeId !== undefined && nodeId !== null) {
				actionProperty.action_node_id = String(nodeId);
			}


			this.rum.startAction({
				actionName,
				actionType: eventType,
				property: actionProperty
			});
		} catch (error) {
			console.warn('[FTLog] UniApp JS Action collection failed:', error);
		}
	}

	getActionNode(pageId, nodeId) {
		const page = this.getPage(pageId);
		return this.findNodeById(page && (page.__page_container__ ||
			(page.$vm && page.$vm.__page_container__)), nodeId);
	}

	resolveHandlerAction(context) {
		const handler = this.actionTrackingHandler;
		if (!handler) {
			return {
				skip: false,
				actionName: null,
				property: null
			};
		}

		try {
			const wrapper = {
				getSource: () => context.node || null,
				getSourceType: () => context.eventType,
				getExtra: () => ({
					pageId: context.pageId === undefined || context.pageId === null ? null : String(context.pageId),
					pagePath: context.pagePath,
					event: context.event || null,
					property: context.property || null
				})
			};
			const action = typeof handler === 'function' ? handler(wrapper) :
				handler.resolveHandlerAction(wrapper);
			if (action === null || action === undefined) {
				return {
					skip: true,
					actionName: null,
					property: null
				};
			}

			const actionName = typeof action === 'string' ? action :
				(typeof action.getActionName === 'function' ? action.getActionName() : action.actionName);
			return {
				skip: !this.isValidOperationName(actionName),
				actionName,
				property: typeof action === 'object' && typeof action.getProperty === 'function' ?
					action.getProperty() : action.property
			};
		} catch (error) {
			console.warn('[FTLog] UniApp Action tracking handler failed:', error);
			return {
				skip: true,
				actionName: null,
				property: null
			};
		}
	}

	getDefaultActionName({
		node,
		pageId,
		nodeId,
		event,
		eventType
	}) {
		if (!node) {
			return {
				actionName: this.getOperationName(pageId, nodeId, event, eventType) || eventType,
				position: null
			};
		}
		if (this.hasInternalEventHandler(node, event && event.type)) {
			return {
				actionName: null,
				position: null
			};
		}

		const componentName = this.getComponentName(node);
		const text = this.getNodeText(node);
		const resourceId = this.getResourceId(node, event);
		const position = this.getListPosition(pageId, node, event);
		let actionName = componentName;
		if (text) {
			actionName += '/' + text;
		}
		if (resourceId) {
			actionName += '#' + resourceId;
		}
		if (position !== null) {
			actionName += '#position:' + position;
		}
		return {
			actionName,
			position
		};
	}

	getComponentName(node) {
		const rawName = node && (node.nodeName || node.tagName || node.type || node.componentName);
		const normalizedName = typeof rawName === 'string' ? rawName
			.trim()
			.replace(/^uni[-_]?/i, '')
			.toLowerCase() : '';
		if (!normalizedName || normalizedName === '#text') {
			return 'View';
		}
		return normalizedName.split(/[-_\s]+/).filter(Boolean).map((part) =>
			part.charAt(0).toUpperCase() + part.slice(1)
		).join('') || 'View';
	}

	getResourceId(node, event) {
		const attributes = node && node.attributes ? node.attributes : {};
		const eventTarget = event && (event.currentTarget || event.target);
		const candidates = [
			attributes.id,
			node && node.id,
			eventTarget && eventTarget.id
		];
		const resourceId = candidates.find((candidate) => candidate !== undefined && candidate !== null &&
			String(candidate).trim());
		return resourceId === undefined ? '' : String(resourceId).trim();
	}

	getListPosition(pageId, node, event) {
		const eventTarget = event && (event.currentTarget || event.target);
		const eventDataset = eventTarget && eventTarget.dataset ? eventTarget.dataset : {};
		const nodeAttributes = node && node.attributes ? node.attributes : {};
		const detail = event && event.detail ? event.detail : {};
		const candidates = [
			event && event.position,
			event && event.index,
			detail.position,
			detail.index,
			eventTarget && eventTarget.position,
			eventTarget && eventTarget.index,
			eventDataset.position,
			eventDataset.index,
			eventDataset.itemIndex,
			eventDataset.itemindex,
			node && node.position,
			node && node.index,
			nodeAttributes.position,
			nodeAttributes.index,
			nodeAttributes['data-position'],
			nodeAttributes['data-index']
		];
		const position = candidates.find((candidate) => candidate !== undefined && candidate !== null &&
			String(candidate).trim() !== '');
		if (position !== undefined) {
			return String(position);
		}

		const page = this.getPage(pageId);
		const rootNode = page && (page.__page_container__ || (page.$vm && page.$vm.__page_container__));
		const nodePath = this.findNodePathById(rootNode, node.nodeId);
		for (let index = 0; nodePath && index < nodePath.length - 1; index += 1) {
			const parent = nodePath[index];
			if (!this.isListContainer(parent)) {
				continue;
			}
			const item = nodePath[index + 1];
			const children = Array.isArray(parent.childNodes) ? parent.childNodes : [];
			const itemPosition = children.indexOf(item);
			if (itemPosition >= 0) {
				return String(itemPosition);
			}
		}
		return null;
	}

	findNodePathById(node, nodeId, path = []) {
		if (!node) {
			return null;
		}
		const nextPath = path.concat(node);
		if (String(node.nodeId) === String(nodeId)) {
			return nextPath;
		}
		const children = Array.isArray(node.childNodes) ? node.childNodes : [];
		for (let index = 0; index < children.length; index += 1) {
			const result = this.findNodePathById(children[index], nodeId, nextPath);
			if (result) {
				return result;
			}
		}
		return null;
	}

	isListContainer(node) {
		const name = this.getComponentName(node).toLowerCase();
		return name === 'list' || name === 'listview' || name === 'recyclerlist' ||
			name === 'recycler' || name === 'scrollview';
	}

	getTabActionName(tabText, tabIndex) {
		let actionName = 'Tab';
		if (tabText) {
			actionName += '/' + tabText;
		}
		if (typeof tabIndex === 'number') {
			actionName += '#position:' + tabIndex;
		}
		return actionName;
	}

	getOperationName(pageId, nodeId, event, eventType) {
		const page = this.getPage(pageId);
		const node = this.findNodeById(page && (page.__page_container__ ||
			(page.$vm && page.$vm.__page_container__)), nodeId);
		const methodName = this.getEventMethodName(node, event && event.type);
		if (methodName) {
			return methodName;
		}
		if (this.hasInternalEventHandler(node, event && event.type)) {
			return null;
		}

		const eventTarget = event && (event.currentTarget || event.target);
		const dataset = eventTarget && eventTarget.dataset;
		const datasetName = dataset && (dataset.actionName || dataset.actionname || dataset.name);
		if (this.isValidOperationName(datasetName)) {
			return datasetName;
		}
		if (eventTarget && this.isValidOperationName(eventTarget.id)) {
			return eventTarget.id;
		}

		const nodeText = this.getNodeText(node);
		if (this.isValidOperationName(nodeText)) {
			return nodeText;
		}
		// Do not report an unnamed event as a generic `click`: on Harmony these
		// are commonly framework controls (for example the TabBar's __Common__
		// listener), not a business operation.
		return null;
	}

	getPage(pageId) {
		try {
			const pages = getCurrentPages();
			return pages.find((page) => {
				const runtimePage = page && (page.$page || page.$basePage || page);
				return runtimePage && String(runtimePage.id) === String(pageId);
			}) || pages[pages.length - 1] || null;
		} catch (_) {
			return null;
		}
	}

	getActivePageId() {
		try {
			const page = this.getPage();
			const runtimePage = page && (page.$page || page.$basePage || page);
			return runtimePage && runtimePage.id !== undefined && runtimePage.id !== null ?
				runtimePage.id : undefined;
		} catch (_) {
			return undefined;
		}
	}

	findNodeById(node, nodeId) {
		if (!node) {
			return null;
		}
		if (String(node.nodeId) === String(nodeId)) {
			return node;
		}
		const children = Array.isArray(node.childNodes) ? node.childNodes : [];
		for (let index = 0; index < children.length; index += 1) {
			const target = this.findNodeById(children[index], nodeId);
			if (target) {
				return target;
			}
		}
		return null;
	}

	findNavigatorNode(node, url) {
		if (!node) {
			return null;
		}
		const attributes = node.attributes || {};
		if (String(node.nodeName).toLowerCase() === 'navigator' &&
			typeof url === 'string' && attributes.url === url) {
			return node;
		}
		const children = Array.isArray(node.childNodes) ? node.childNodes : [];
		for (let index = 0; index < children.length; index += 1) {
			const target = this.findNavigatorNode(children[index], url);
			if (target) {
				return target;
			}
		}
		return null;
	}

	getEventMethodName(node, eventType) {
		if (!node || !node.listeners || typeof eventType !== 'string') {
			return null;
		}
		const listeners = node.listeners[eventType] || [];
		for (let index = 0; index < listeners.length; index += 1) {
			const listener = listeners[index];
			const handlers = Array.isArray(listener && listener.value) ? listener.value : [listener && listener.value];
			for (let handlerIndex = 0; handlerIndex < handlers.length; handlerIndex += 1) {
				const methodName = this.getMethodNameFromHandler(handlers[handlerIndex]);
				if (methodName) {
					return methodName;
				}
			}
		}
		return null;
	}

	hasInternalEventHandler(node, eventType) {
		if (!node || !node.listeners || typeof eventType !== 'string') {
			return false;
		}
		const listeners = node.listeners[eventType] || [];
		for (let index = 0; index < listeners.length; index += 1) {
			const listener = listeners[index];
			const handlers = Array.isArray(listener && listener.value) ? listener.value : [listener && listener.value];
			for (let handlerIndex = 0; handlerIndex < handlers.length; handlerIndex += 1) {
				const handler = handlers[handlerIndex];
				const handlerName = typeof handler === 'function' && handler.name ?
					handler.name.replace(/^bound\s+/, '') : '';
				if (this.isInternalOperationName(handlerName)) {
					return true;
				}
			}
		}
		return false;
	}

	getMethodNameFromHandler(handler) {
		if (typeof handler !== 'function') {
			return null;
		}

		const handlerSource = Function.prototype.toString.call(handler);
		const methodMatch = handlerSource.match(/(?:\$options|_ctx|this)\.([A-Za-z_$][\w$]*)\s*\(/);
		if (methodMatch) {
			return this.isValidOperationName(methodMatch[1]) ? methodMatch[1] : null;
		}

		const functionMatch = handlerSource.match(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/);
		if (functionMatch) {
			return this.isValidOperationName(functionMatch[1]) ? functionMatch[1] : null;
		}

		const handlerName = handler.name && handler.name.replace(/^bound\s+/, '');
		return this.isValidOperationName(handlerName) ? handlerName : null;
	}

	// `__Common__/` is an internal listener name assigned by the Harmony
	// runtime to framework controls. It is not stable business semantics and
	// must never become an Action name.
	isValidOperationName(name) {
		if (typeof name !== 'string') {
			return false;
		}
		const normalizedName = name.trim();
		return !!normalizedName && normalizedName !== 'invoker' &&
			!this.isInternalOperationName(normalizedName);
	}

	isInternalOperationName(name) {
		return typeof name === 'string' &&
			(name.startsWith('__') || name.includes('__Common__'));
	}

	getTabBarItem(url) {
		try {
			if (typeof __uniConfig === 'undefined' || !__uniConfig.tabBar ||
				!Array.isArray(__uniConfig.tabBar.list)) {
				return null;
			}
			const targetPath = this.normalizeRoutePath(url);
			const index = __uniConfig.tabBar.list.findIndex((tab) =>
				this.normalizeRoutePath(tab && tab.pagePath) === targetPath);
			if (index === -1) {
				return null;
			}
			const tab = __uniConfig.tabBar.list[index];
			return {
				index,
				pagePath: tab && tab.pagePath,
				text: tab && tab.text
			};
		} catch (_) {
			return null;
		}
	}

	normalizeRoutePath(url) {
		return typeof url === 'string' ? url.split('?')[0].replace(/^\//, '') : '';
	}

	getNodeText(node) {
		if (!node) {
			return '';
		}
		const ownText = typeof node.nodeValue === 'string' ? node.nodeValue :
			(typeof node.textContent === 'string' ? node.textContent : '');
		if (ownText) {
			return ownText.trim();
		}
		const children = Array.isArray(node.childNodes) ? node.childNodes : [];
		return children.map((child) => this.getNodeText(child)).filter(Boolean).join(' ').trim();
	}

	getPagePath(pageId) {
		try {
			const page = this.getPage(pageId);
			if (!page) {
				return null;
			}
			const candidates = [
				page.$page && page.$page.fullPath,
				page.fullPath,
				page.route,
				page.$page && page.$page.route
			];
			return candidates.find((path) => typeof path === 'string' && path.trim() &&
				!/^\d+$/.test(path.trim().split('?')[0])) || null;
		} catch (_) {
			return null;
		}
	}
}

export const gcActionTracking = new ActionMonitor();
