if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  function currentPageCaptureScreenshot(fullPage, callback) {
    var _a;
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    (_a = currentPage.vm) === null || _a === void 0 ? void 0 : _a.$viewToTempFilePath({
      wholeContent: fullPage,
      overwrite: true,
      success: (res) => {
        const fileManager = uni.getFileSystemManager();
        fileManager.readFile({
          encoding: "base64",
          filePath: res.tempFilePath,
          success(readFileRes) {
            callback(readFileRes.data, "");
          },
          fail(err) {
            callback("", `captureScreenshot fail: ${JSON.stringify(err)}`);
          }
        });
      },
      fail: (err) => {
        callback("", `captureScreenshot fail: ${JSON.stringify(err)}`);
      }
    });
  }
  function initRuntimeSocket(hosts, port, id) {
    if (hosts == "" || port == "" || id == "")
      return Promise.resolve(null);
    return hosts.split(",").reduce((promise, host) => {
      return promise.then((socket) => {
        if (socket != null)
          return Promise.resolve(socket);
        return tryConnectSocket(host, port, id);
      });
    }, Promise.resolve(null));
  }
  const SOCKET_TIMEOUT = 500;
  function tryConnectSocket(host, port, id) {
    return new Promise((resolve, reject) => {
      const socket = uni.connectSocket({
        url: `ws://${host}:${port}/${id}`,
        multiple: true,
        // 支付宝小程序 是否开启多实例
        fail() {
          resolve(null);
        }
      });
      const timer = setTimeout(() => {
        socket.close({
          code: 1006,
          reason: "connect timeout"
        });
        resolve(null);
      }, SOCKET_TIMEOUT);
      socket.onOpen((e) => {
        clearTimeout(timer);
        resolve(socket);
      });
      socket.onClose((e) => {
        clearTimeout(timer);
        resolve(null);
      });
      socket.onError((e) => {
        clearTimeout(timer);
        resolve(null);
      });
      socket.onMessage((result) => {
        const message = JSON.parse(result.data);
        if (message["type"] == "screencap") {
          const id2 = message["id"];
          currentPageCaptureScreenshot(message.fullPage, (base64, error) => {
            socket.send({
              data: JSON.stringify({
                id: id2,
                base64,
                error
              })
            });
          });
        }
        resolve(null);
      });
    });
  }
  const CONSOLE_TYPES = ["log", "warn", "error", "info", "debug"];
  const originalConsole = /* @__PURE__ */ CONSOLE_TYPES.reduce((methods, type) => {
    methods[type] = console[type].bind(console);
    return methods;
  }, {});
  let sendError = null;
  const errorQueue = /* @__PURE__ */ new Set();
  const errorExtra = {};
  function sendErrorMessages(errors) {
    if (sendError == null) {
      errors.forEach((error) => {
        errorQueue.add(error);
      });
      return;
    }
    const data = errors.map((err) => {
      if (typeof err === "string") {
        return err;
      }
      const isPromiseRejection = err && "promise" in err && "reason" in err;
      const prefix = isPromiseRejection ? "UnhandledPromiseRejection: " : "";
      if (isPromiseRejection) {
        err = err.reason;
      }
      if (err instanceof Error && err.stack) {
        if (err.message && !err.stack.includes(err.message)) {
          return `${prefix}${err.message}
${err.stack}`;
        }
        return `${prefix}${err.stack}`;
      }
      if (typeof err === "object" && err !== null) {
        try {
          return prefix + JSON.stringify(err);
        } catch (err2) {
          return prefix + String(err2);
        }
      }
      return prefix + String(err);
    }).filter(Boolean);
    if (data.length > 0) {
      sendError(JSON.stringify(Object.assign({
        type: "error",
        data
      }, errorExtra)));
    }
  }
  function setSendError(value, extra = {}) {
    sendError = value;
    Object.assign(errorExtra, extra);
    if (value != null && errorQueue.size > 0) {
      const errors = Array.from(errorQueue);
      errorQueue.clear();
      sendErrorMessages(errors);
    }
  }
  function initOnError() {
    function onError(error) {
      try {
        if (typeof PromiseRejectionEvent !== "undefined" && error instanceof PromiseRejectionEvent && error.reason instanceof Error && error.reason.message && error.reason.message.includes(`Cannot create property 'errMsg' on string 'taskId`)) {
          return;
        }
        if (false)
          ;
        sendErrorMessages([error]);
      } catch (err) {
        originalConsole.error(err);
      }
    }
    if (typeof uni !== "undefined") {
      if (typeof uni.onError === "function") {
        uni.onError(onError);
      }
      if (typeof uni.onUnhandledRejection === "function") {
        uni.onUnhandledRejection(onError);
      }
    }
    return function offError() {
      if (typeof uni !== "undefined") {
        if (typeof uni.offError === "function") {
          uni.offError(onError);
        }
        if (typeof uni.offUnhandledRejection === "function") {
          uni.offUnhandledRejection(onError);
        }
      }
    };
  }
  function formatMessage(type, args) {
    try {
      return {
        type,
        args: formatArgs(args)
      };
    } catch (e) {
    }
    return {
      type,
      args: []
    };
  }
  function formatArgs(args) {
    return args.map((arg) => formatArg(arg));
  }
  function formatArg(arg, depth = 0) {
    if (depth >= 7) {
      return {
        type: "object",
        value: "[Maximum depth reached]"
      };
    }
    const type = typeof arg;
    switch (type) {
      case "string":
        return formatString(arg);
      case "number":
        return formatNumber(arg);
      case "boolean":
        return formatBoolean(arg);
      case "object":
        try {
          return formatObject(arg, depth);
        } catch (e) {
          return {
            type: "object",
            value: {
              properties: []
            }
          };
        }
      case "undefined":
        return formatUndefined();
      case "function":
        return formatFunction(arg);
      case "symbol": {
        return formatSymbol(arg);
      }
      case "bigint":
        return formatBigInt(arg);
    }
  }
  function formatFunction(value) {
    return {
      type: "function",
      value: `function ${value.name}() {}`
    };
  }
  function formatUndefined() {
    return {
      type: "undefined"
    };
  }
  function formatBoolean(value) {
    return {
      type: "boolean",
      value: String(value)
    };
  }
  function formatNumber(value) {
    return {
      type: "number",
      value: String(value)
    };
  }
  function formatBigInt(value) {
    return {
      type: "bigint",
      value: String(value)
    };
  }
  function formatString(value) {
    return {
      type: "string",
      value
    };
  }
  function formatSymbol(value) {
    return {
      type: "symbol",
      value: value.description
    };
  }
  function formatObject(value, depth) {
    if (value === null) {
      return {
        type: "null"
      };
    }
    {
      if (isComponentPublicInstance(value)) {
        return formatComponentPublicInstance(value, depth);
      }
      if (isComponentInternalInstance(value)) {
        return formatComponentInternalInstance(value, depth);
      }
      if (isUniElement(value)) {
        return formatUniElement(value, depth);
      }
      if (isCSSStyleDeclaration(value)) {
        return formatCSSStyleDeclaration(value, depth);
      }
    }
    if (Array.isArray(value)) {
      return {
        type: "object",
        subType: "array",
        value: {
          properties: value.map((v, i) => formatArrayElement(v, i, depth + 1))
        }
      };
    }
    if (value instanceof Set) {
      return {
        type: "object",
        subType: "set",
        className: "Set",
        description: `Set(${value.size})`,
        value: {
          entries: Array.from(value).map((v) => formatSetEntry(v, depth + 1))
        }
      };
    }
    if (value instanceof Map) {
      return {
        type: "object",
        subType: "map",
        className: "Map",
        description: `Map(${value.size})`,
        value: {
          entries: Array.from(value.entries()).map((v) => formatMapEntry(v, depth + 1))
        }
      };
    }
    if (value instanceof Promise) {
      return {
        type: "object",
        subType: "promise",
        value: {
          properties: []
        }
      };
    }
    if (value instanceof RegExp) {
      return {
        type: "object",
        subType: "regexp",
        value: String(value),
        className: "Regexp"
      };
    }
    if (value instanceof Date) {
      return {
        type: "object",
        subType: "date",
        value: String(value),
        className: "Date"
      };
    }
    if (value instanceof Error) {
      return {
        type: "object",
        subType: "error",
        value: value.message || String(value),
        className: value.name || "Error"
      };
    }
    let className = void 0;
    {
      const constructor = value.constructor;
      if (constructor) {
        if (constructor.get$UTSMetadata$) {
          className = constructor.get$UTSMetadata$().name;
        }
      }
    }
    let entries = Object.entries(value);
    if (isHarmonyBuilderParams(value)) {
      entries = entries.filter(([key]) => key !== "modifier" && key !== "nodeContent");
    }
    return {
      type: "object",
      className,
      value: {
        properties: entries.map((entry) => formatObjectProperty(entry[0], entry[1], depth + 1))
      }
    };
  }
  function isHarmonyBuilderParams(value) {
    return value.modifier && value.modifier._attribute && value.nodeContent;
  }
  function isComponentPublicInstance(value) {
    return value.$ && isComponentInternalInstance(value.$);
  }
  function isComponentInternalInstance(value) {
    return value.type && value.uid != null && value.appContext;
  }
  function formatComponentPublicInstance(value, depth) {
    return {
      type: "object",
      className: "ComponentPublicInstance",
      value: {
        properties: Object.entries(value.$.type).map(([name, value2]) => formatObjectProperty(name, value2, depth + 1))
      }
    };
  }
  function formatComponentInternalInstance(value, depth) {
    return {
      type: "object",
      className: "ComponentInternalInstance",
      value: {
        properties: Object.entries(value.type).map(([name, value2]) => formatObjectProperty(name, value2, depth + 1))
      }
    };
  }
  function isUniElement(value) {
    return value.style && value.tagName != null && value.nodeName != null;
  }
  function formatUniElement(value, depth) {
    return {
      type: "object",
      // 非 x 没有 UniElement 的概念
      // className: 'UniElement',
      value: {
        properties: Object.entries(value).filter(([name]) => [
          "id",
          "tagName",
          "nodeName",
          "dataset",
          "offsetTop",
          "offsetLeft",
          "style"
        ].includes(name)).map(([name, value2]) => formatObjectProperty(name, value2, depth + 1))
      }
    };
  }
  function isCSSStyleDeclaration(value) {
    return typeof value.getPropertyValue === "function" && typeof value.setProperty === "function" && value.$styles;
  }
  function formatCSSStyleDeclaration(style, depth) {
    return {
      type: "object",
      value: {
        properties: Object.entries(style.$styles).map(([name, value]) => formatObjectProperty(name, value, depth + 1))
      }
    };
  }
  function formatObjectProperty(name, value, depth) {
    const result = formatArg(value, depth);
    result.name = name;
    return result;
  }
  function formatArrayElement(value, index, depth) {
    const result = formatArg(value, depth);
    result.name = `${index}`;
    return result;
  }
  function formatSetEntry(value, depth) {
    return {
      value: formatArg(value, depth)
    };
  }
  function formatMapEntry(value, depth) {
    return {
      key: formatArg(value[0], depth),
      value: formatArg(value[1], depth)
    };
  }
  let sendConsole = null;
  const messageQueue = [];
  const messageExtra = {};
  const EXCEPTION_BEGIN_MARK = "---BEGIN:EXCEPTION---";
  const EXCEPTION_END_MARK = "---END:EXCEPTION---";
  function sendConsoleMessages(messages) {
    if (sendConsole == null) {
      messageQueue.push(...messages);
      return;
    }
    sendConsole(JSON.stringify(Object.assign({
      type: "console",
      data: messages
    }, messageExtra)));
  }
  function setSendConsole(value, extra = {}) {
    sendConsole = value;
    Object.assign(messageExtra, extra);
    if (value != null && messageQueue.length > 0) {
      const messages = messageQueue.slice();
      messageQueue.length = 0;
      sendConsoleMessages(messages);
    }
  }
  function rewriteConsole() {
    {
      if (typeof UTSProxyObject === "object" && UTSProxyObject !== null && typeof UTSProxyObject.invokeSync === "function") {
        UTSProxyObject.invokeSync("__UniConsole", "setSendConsoleMessages", [
          sendConsoleMessages
        ]);
      }
    }
    function wrapConsole(type) {
      return function(...args) {
        if (type === "error" && args.length === 1) {
          const arg = args[0];
          if (typeof arg === "string" && arg.startsWith(EXCEPTION_BEGIN_MARK)) {
            const startIndex = EXCEPTION_BEGIN_MARK.length;
            const endIndex = arg.length - EXCEPTION_END_MARK.length;
            sendErrorMessages([arg.slice(startIndex, endIndex)]);
            return;
          } else if (arg instanceof Error) {
            sendErrorMessages([arg]);
            return;
          }
        }
        sendConsoleMessages([formatMessage(type, args)]);
      };
    }
    if (isConsoleWritable()) {
      CONSOLE_TYPES.forEach((type) => {
        console[type] = wrapConsole(type);
      });
      return function restoreConsole() {
        CONSOLE_TYPES.forEach((type) => {
          console[type] = originalConsole[type];
        });
      };
    } else {
      {
        if (typeof uni !== "undefined" && uni.__f__) {
          const oldLog = uni.__f__;
          if (oldLog) {
            uni.__f__ = function(...args) {
              const [type, filename, ...rest] = args;
              oldLog(type, "", ...rest);
              sendConsoleMessages([formatMessage(type, [...rest, filename])]);
            };
            return function restoreConsole() {
              uni.__f__ = oldLog;
            };
          }
        }
      }
    }
    return function restoreConsole() {
      {
        if (typeof UTSProxyObject === "object" && UTSProxyObject !== null && typeof UTSProxyObject.invokeSync === "function") {
          UTSProxyObject.invokeSync("__UniConsole", "restoreConsole", []);
        }
      }
    };
  }
  function isConsoleWritable() {
    const value = console.log;
    const sym = Symbol();
    try {
      console.log = sym;
    } catch (ex) {
      return false;
    }
    const isWritable = console.log === sym;
    console.log = value;
    return isWritable;
  }
  const UNI_CONSOLE_RUNTIME_PROMISE = "__uni_console_runtime_promise__";
  function initRuntimeSocketService() {
    const hosts = "127.0.0.1,10.100.64.205";
    const port = "8090";
    const id = "app-harmony_sPPNrl";
    const runtimeGlobal = getRuntimeGlobal();
    const existingPromise = runtimeGlobal === null || runtimeGlobal === void 0 ? void 0 : runtimeGlobal[UNI_CONSOLE_RUNTIME_PROMISE];
    if (existingPromise) {
      return existingPromise;
    }
    let runtimePromise = initRuntimeSocketServiceOnce(hosts, port, id);
    if (runtimeGlobal) {
      runtimePromise = runtimePromise.then((success) => {
        if (!success && runtimeGlobal[UNI_CONSOLE_RUNTIME_PROMISE] === runtimePromise) {
          delete runtimeGlobal[UNI_CONSOLE_RUNTIME_PROMISE];
        }
        return success;
      }, (error) => {
        if (runtimeGlobal[UNI_CONSOLE_RUNTIME_PROMISE] === runtimePromise) {
          delete runtimeGlobal[UNI_CONSOLE_RUNTIME_PROMISE];
        }
        throw error;
      });
      runtimeGlobal[UNI_CONSOLE_RUNTIME_PROMISE] = runtimePromise;
    }
    return runtimePromise;
  }
  function initRuntimeSocketServiceOnce(hosts, port, id) {
    const lazy = typeof swan !== "undefined";
    let restoreError = lazy ? () => {
    } : initOnError();
    let restoreConsole = lazy ? () => {
    } : rewriteConsole();
    return Promise.resolve().then(() => {
      if (lazy) {
        restoreError = initOnError();
        restoreConsole = rewriteConsole();
      }
      return initRuntimeSocket(hosts, port, id).then((socket) => {
        if (!socket) {
          restoreError();
          restoreConsole();
          originalConsole.error(wrapError("开发模式下日志通道建立 socket 连接失败。"));
          originalConsole.error(wrapError("如果是运行到真机，请确认手机与电脑处于同一网络。"));
          return false;
        }
        socket.onClose(() => {
          {
            originalConsole.error(wrapError("手机端日志通道 socket 连接已断开，请重启基座应用或重新运行。"));
          }
          restoreError();
          restoreConsole();
        });
        setSendConsole((data) => {
          socket.send({
            data
          });
        });
        setSendError((data) => {
          socket.send({
            data
          });
        });
        return true;
      });
    });
  }
  const ERROR_CHAR = "‌";
  function wrapError(error) {
    return `${ERROR_CHAR}${error}${ERROR_CHAR}`;
  }
  function getRuntimeGlobal() {
    const miniProgramGlobal = getMiniProgramGlobal();
    if (miniProgramGlobal) {
      return miniProgramGlobal;
    }
    if (typeof globalThis !== "undefined") {
      return globalThis;
    }
  }
  function getMiniProgramGlobal() {
    if (typeof wx !== "undefined") {
      return wx;
    } else if (typeof my !== "undefined") {
      return my;
    } else if (typeof tt !== "undefined") {
      return tt;
    } else if (typeof swan !== "undefined") {
      return swan;
    } else if (typeof qq !== "undefined") {
      return qq;
    } else if (typeof ks !== "undefined") {
      return ks;
    } else if (typeof jd !== "undefined") {
      return jd;
    } else if (typeof xhs !== "undefined") {
      return xhs;
    } else if (typeof has !== "undefined") {
      return has;
    } else if (typeof qa !== "undefined") {
      return qa;
    }
  }
  initRuntimeSocketService();
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const GCUniPlugin_utsProxy = uni.requireUTSPlugin("uni_modules/GC-UniPlugin");
  const VD_SYNC_EVENT = "vdSync";
  const INVOKE_SERVICE_API_EVENT = "invokeServiceApi";
  const VDOM_EVENT_ACTION = 20;
  const TRACKED_EVENT_TYPES = ["click", "tap", "longpress", "longtap"];
  const ROUTE_API_NAMES = ["navigateTo", "redirectTo", "reLaunch", "switchTab", "navigateBack"];
  function normalizeUniAppEventType(type) {
    if (typeof type !== "string" || !type) {
      return "";
    }
    const eventName = type.replace(/^on/, "").replace(/(?:Once|Passive|Capture)+$/, "");
    if (!eventName) {
      return "";
    }
    return eventName.charAt(0).toLowerCase() + eventName.slice(1).replace(/([A-Z])/g, "-$1").toLowerCase();
  }
  class ActionMonitor {
    constructor() {
      this.initialized = false;
      this.tabSwitchInterceptorInstalled = false;
      this.actionTrackingHandler = null;
      this.retryTimer = null;
      this.retryAttempts = 0;
      this.lastTabSwitch = {
        path: "",
        timestamp: 0
      };
      this.rum = GCUniPlugin_utsProxy.rum;
      this.handleVdSync = this.handleVdSync.bind(this);
      this.handleServiceAPI = this.handleServiceAPI.bind(this);
    }
    startTracking() {
      if (this.initialized) {
        return;
      }
      this.installTabSwitchInterceptor();
      const bridge = this.getHarmonyBridge();
      if (!bridge || typeof bridge.subscribe !== "function") {
        this.scheduleStartTracking();
        return;
      }
      bridge.subscribe(VD_SYNC_EVENT, this.handleVdSync);
      bridge.subscribe(INVOKE_SERVICE_API_EVENT, this.handleServiceAPI);
      this.initialized = true;
      this.retryAttempts = 0;
      formatAppLog("log", "at uni_modules/GC-UniPlugin/js_sdk/Action/GCActionTracking.js:81", "[FTLog] UniApp JS Action tracking initialized");
    }
    scheduleStartTracking() {
      if (this.retryTimer !== null || this.retryAttempts >= 20 || typeof setTimeout !== "function") {
        if (this.retryAttempts >= 20) {
          formatAppLog("warn", "at uni_modules/GC-UniPlugin/js_sdk/Action/GCActionTracking.js:88", "[FTLog] UniApp JS Action bridge is unavailable; JS Action collection is disabled");
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
      if (typeof globalThis === "undefined") {
        return null;
      }
      return globalThis.UniServiceJSBridge || null;
    }
    isJSActionTrackingEnabled() {
      return typeof this.rum.isUniAppJSActionTrackingEnabled !== "function" || this.rum.isUniAppJSActionTrackingEnabled();
    }
    // This has the same callback shape as the native FTActionTrackingHandler:
    // `resolveHandlerAction(wrapper)` may return a HandlerAction-like object
    // (`getActionName` / `getProperty`) or a plain `{ actionName, property }`.
    // Returning null skips the Action, matching the native SDK contract.
    setActionTrackingHandler(handler) {
      this.actionTrackingHandler = handler && (typeof handler === "function" || typeof handler.resolveHandlerAction === "function") ? handler : null;
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
      const isTabSwitch = payload.name === "switchTab";
      if (isTabSwitch) {
        this.trackTabSwitch(args.url, pageId);
        return;
      }
      const page = this.getPage(pageId);
      const node = this.findNavigatorNode(page && (page.__page_container__ || page.$vm && page.$vm.__page_container__), args.url);
      const property = {
        action_source: "uniapp_js_navigator",
        action_route_api: payload.name,
        action_route_url: args.url || ""
      };
      this.trackAction({
        eventType: "click",
        nodeId: node && node.nodeId,
        pageId,
        operationName: node ? null : payload.name,
        property
      });
    }
    installTabSwitchInterceptor() {
      if (this.tabSwitchInterceptorInstalled || typeof uni === "undefined" || !uni || typeof uni.addInterceptor !== "function") {
        return;
      }
      uni.addInterceptor("switchTab", {
        invoke: (options) => {
          if (options && options.from === "tabBar") {
            this.trackTabSwitch(options.url);
          }
        }
      });
      this.tabSwitchInterceptorInstalled = true;
    }
    trackTabSwitch(url, pageId) {
      const tab = this.getTabBarItem(url);
      const targetPagePath = this.normalizeRoutePath(tab && tab.pagePath || url);
      if (!targetPagePath || this.isDuplicateTabSwitch(targetPagePath)) {
        return;
      }
      const tabText = tab && typeof tab.text === "string" ? tab.text : "";
      const actionPageId = pageId !== void 0 && pageId !== null ? pageId : this.getActivePageId();
      const currentPagePath = this.getPagePath(actionPageId);
      const sourcePagePath = currentPagePath ? currentPagePath.split("?")[0] : "";
      const property = {
        action_source: "uniapp_js_tabbar",
        action_route_api: "switchTab",
        action_route_url: "/" + targetPagePath,
        action_page_path: targetPagePath,
        action_target_page_path: targetPagePath
      };
      if (sourcePagePath) {
        property.action_source_page_path = sourcePagePath;
      }
      if (tabText) {
        property.action_tab_text = tabText;
      }
      if (tab && typeof tab.index === "number") {
        property.action_tab_index = String(tab.index);
      }
      this.trackAction({
        eventType: "click",
        pageId: actionPageId,
        operationName: this.getTabActionName(tabText, tab && tab.index),
        property
      });
    }
    isDuplicateTabSwitch(targetPagePath) {
      const now = Date.now();
      const isDuplicate = this.lastTabSwitch.path === targetPagePath && now - this.lastTabSwitch.timestamp < 500;
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
      if (!this.isJSActionTrackingEnabled()) {
        return;
      }
      try {
        const pagePath = this.getPagePath(pageId);
        const viewName = pagePath ? pagePath.split("?")[0] : "unknown_view";
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
          action_source: "uniapp_js_event",
          action_event_type: eventType,
          action_page_path: viewName,
          ...property || {},
          ...handlerAction.property || {}
        };
        if (defaultAction.position !== null) {
          actionProperty.action_position = defaultAction.position;
        }
        if (pageId !== void 0 && pageId !== null) {
          actionProperty.action_page_id = String(pageId);
        }
        if (nodeId !== void 0 && nodeId !== null) {
          actionProperty.action_node_id = String(nodeId);
        }
        this.rum.startAction({
          actionName,
          actionType: eventType,
          property: actionProperty
        });
      } catch (error) {
        formatAppLog("warn", "at uni_modules/GC-UniPlugin/js_sdk/Action/GCActionTracking.js:389", "[FTLog] UniApp JS Action collection failed:", error);
      }
    }
    getActionNode(pageId, nodeId) {
      const page = this.getPage(pageId);
      return this.findNodeById(page && (page.__page_container__ || page.$vm && page.$vm.__page_container__), nodeId);
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
            pageId: context.pageId === void 0 || context.pageId === null ? null : String(context.pageId),
            pagePath: context.pagePath,
            event: context.event || null,
            property: context.property || null
          })
        };
        const action = typeof handler === "function" ? handler(wrapper) : handler.resolveHandlerAction(wrapper);
        if (action === null || action === void 0) {
          return {
            skip: true,
            actionName: null,
            property: null
          };
        }
        const actionName = typeof action === "string" ? action : typeof action.getActionName === "function" ? action.getActionName() : action.actionName;
        return {
          skip: !this.isValidOperationName(actionName),
          actionName,
          property: typeof action === "object" && typeof action.getProperty === "function" ? action.getProperty() : action.property
        };
      } catch (error) {
        formatAppLog("warn", "at uni_modules/GC-UniPlugin/js_sdk/Action/GCActionTracking.js:439", "[FTLog] UniApp Action tracking handler failed:", error);
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
        actionName += "/" + text;
      }
      if (resourceId) {
        actionName += "#" + resourceId;
      }
      if (position !== null) {
        actionName += "#position:" + position;
      }
      return {
        actionName,
        position
      };
    }
    getComponentName(node) {
      const rawName = node && (node.nodeName || node.tagName || node.type || node.componentName);
      const normalizedName = typeof rawName === "string" ? rawName.trim().replace(/^uni[-_]?/i, "").toLowerCase() : "";
      if (!normalizedName || normalizedName === "#text") {
        return "View";
      }
      return normalizedName.split(/[-_\s]+/).filter(Boolean).map(
        (part) => part.charAt(0).toUpperCase() + part.slice(1)
      ).join("") || "View";
    }
    getResourceId(node, event) {
      const attributes = node && node.attributes ? node.attributes : {};
      const eventTarget = event && (event.currentTarget || event.target);
      const candidates = [
        attributes.id,
        node && node.id,
        eventTarget && eventTarget.id
      ];
      const resourceId = candidates.find((candidate) => candidate !== void 0 && candidate !== null && String(candidate).trim());
      return resourceId === void 0 ? "" : String(resourceId).trim();
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
        nodeAttributes["data-position"],
        nodeAttributes["data-index"]
      ];
      const position = candidates.find((candidate) => candidate !== void 0 && candidate !== null && String(candidate).trim() !== "");
      if (position !== void 0) {
        return String(position);
      }
      const page = this.getPage(pageId);
      const rootNode = page && (page.__page_container__ || page.$vm && page.$vm.__page_container__);
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
      return name === "list" || name === "listview" || name === "recyclerlist" || name === "recycler" || name === "scrollview";
    }
    getTabActionName(tabText, tabIndex) {
      let actionName = "Tab";
      if (tabText) {
        actionName += "/" + tabText;
      }
      if (typeof tabIndex === "number") {
        actionName += "#position:" + tabIndex;
      }
      return actionName;
    }
    getOperationName(pageId, nodeId, event, eventType) {
      const page = this.getPage(pageId);
      const node = this.findNodeById(page && (page.__page_container__ || page.$vm && page.$vm.__page_container__), nodeId);
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
        return runtimePage && runtimePage.id !== void 0 && runtimePage.id !== null ? runtimePage.id : void 0;
      } catch (_) {
        return void 0;
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
      if (String(node.nodeName).toLowerCase() === "navigator" && typeof url === "string" && attributes.url === url) {
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
      if (!node || !node.listeners || typeof eventType !== "string") {
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
      if (!node || !node.listeners || typeof eventType !== "string") {
        return false;
      }
      const listeners = node.listeners[eventType] || [];
      for (let index = 0; index < listeners.length; index += 1) {
        const listener = listeners[index];
        const handlers = Array.isArray(listener && listener.value) ? listener.value : [listener && listener.value];
        for (let handlerIndex = 0; handlerIndex < handlers.length; handlerIndex += 1) {
          const handler = handlers[handlerIndex];
          const handlerName = typeof handler === "function" && handler.name ? handler.name.replace(/^bound\s+/, "") : "";
          if (this.isInternalOperationName(handlerName)) {
            return true;
          }
        }
      }
      return false;
    }
    getMethodNameFromHandler(handler) {
      if (typeof handler !== "function") {
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
      const handlerName = handler.name && handler.name.replace(/^bound\s+/, "");
      return this.isValidOperationName(handlerName) ? handlerName : null;
    }
    // `__Common__/` is an internal listener name assigned by the Harmony
    // runtime to framework controls. It is not stable business semantics and
    // must never become an Action name.
    isValidOperationName(name) {
      if (typeof name !== "string") {
        return false;
      }
      const normalizedName = name.trim();
      return !!normalizedName && normalizedName !== "invoker" && !this.isInternalOperationName(normalizedName);
    }
    isInternalOperationName(name) {
      return typeof name === "string" && (name.startsWith("__") || name.includes("__Common__"));
    }
    getTabBarItem(url) {
      try {
        if (typeof __uniConfig === "undefined" || !__uniConfig.tabBar || !Array.isArray(__uniConfig.tabBar.list)) {
          return null;
        }
        const targetPath = this.normalizeRoutePath(url);
        const index = __uniConfig.tabBar.list.findIndex((tab2) => this.normalizeRoutePath(tab2 && tab2.pagePath) === targetPath);
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
      return typeof url === "string" ? url.split("?")[0].replace(/^\//, "") : "";
    }
    getNodeText(node) {
      if (!node) {
        return "";
      }
      const ownText = typeof node.nodeValue === "string" ? node.nodeValue : typeof node.textContent === "string" ? node.textContent : "";
      if (ownText) {
        return ownText.trim();
      }
      const children = Array.isArray(node.childNodes) ? node.childNodes : [];
      return children.map((child) => this.getNodeText(child)).filter(Boolean).join(" ").trim();
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
        return candidates.find((path) => typeof path === "string" && path.trim() && !/^\d+$/.test(path.trim().split("?")[0])) || null;
      } catch (_) {
        return null;
      }
    }
  }
  const gcActionTracking = new ActionMonitor();
  let interceptorInstalled = false;
  function isHarmonyPlatform() {
    if (typeof uni === "undefined" || typeof uni.getSystemInfoSync !== "function") {
      return false;
    }
    return uni.getSystemInfoSync().platform === "harmonyos";
  }
  function createRequestKey() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      const random = Math.random() * 16 | 0;
      const value = c === "x" ? random : random & 3 | 8;
      return value.toString(16);
    });
  }
  function stringifyResponseBody(value) {
    if (value === null || value === void 0) {
      return "";
    }
    if (typeof value === "string") {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }
  function completeResource(request, response) {
    try {
      GCUniPlugin_utsProxy.rum.stopResource({ key: request.key });
      GCUniPlugin_utsProxy.rum.addResource({
        key: request.key,
        content: {
          url: request.url,
          httpMethod: request.method,
          requestHeader: request.requestHeaders,
          responseHeader: response.header,
          responseBody: stringifyResponseBody(response.data),
          resourceStatus: response.statusCode
        }
      });
      formatAppLog("log", "at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:50", "[GC-UniPlugin] Harmony uni.request resource completed:", response.statusCode, request.url, request.key);
    } catch (error) {
      formatAppLog("error", "at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:52", "[GC-UniPlugin] Harmony uni.request tracking success failed:", error);
    }
  }
  function completeResourceError(request, error) {
    try {
      const errorMessage = error.errMsg || error.message || String(error);
      const errorStack = error.stack || errorMessage;
      GCUniPlugin_utsProxy.rum.stopResource({ key: request.key });
      GCUniPlugin_utsProxy.rum.addResource({
        key: request.key,
        content: {
          url: request.url,
          httpMethod: request.method,
          requestHeader: request.requestHeaders,
          responseBody: stringifyResponseBody(error.data),
          resourceStatus: error.statusCode || 0,
          errorMessage,
          errorStack
        }
      });
      formatAppLog("warn", "at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:76", "[GC-UniPlugin] Harmony uni.request resource failed:", errorMessage, request.url, request.key);
    } catch (trackingError) {
      formatAppLog("error", "at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:78", "[GC-UniPlugin] Harmony uni.request tracking fail failed:", trackingError);
    }
  }
  const gcHarmonyNetworkTracking = {
    startTracking() {
      const platform2 = typeof uni !== "undefined" && typeof uni.getSystemInfoSync === "function" ? uni.getSystemInfoSync().platform : "unknown";
      const hasAddInterceptor = typeof uni !== "undefined" && typeof uni.addInterceptor === "function";
      const nativeResourceEnabled = typeof GCUniPlugin_utsProxy.rum.isHarmonyUniRequestAutoTrackingEnabled === "function" && GCUniPlugin_utsProxy.rum.isHarmonyUniRequestAutoTrackingEnabled();
      if (interceptorInstalled || !isHarmonyPlatform() || !hasAddInterceptor || !nativeResourceEnabled) {
        formatAppLog("warn", "at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:99", "[GC-UniPlugin] Harmony uni.request tracker not installed:", {
          interceptorInstalled,
          platform: platform2,
          hasAddInterceptor,
          nativeResourceEnabled
        });
        return false;
      }
      uni.addInterceptor("request", {
        invoke(options) {
          try {
            const key = options.__gcResourceKey || createRequestKey();
            delete options.__gcResourceKey;
            formatAppLog("log", "at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:115", "[GC-UniPlugin] Harmony uni.request start:", options.method || "GET", options.url, key);
            GCUniPlugin_utsProxy.rum.startResource({ key });
            const request = {
              key,
              url: options.url,
              method: options.method || "GET",
              requestHeaders: options.header || {}
            };
            const originalSuccess = options.success;
            const originalFail = options.fail;
            options.success = (response) => {
              completeResource(request, response);
              return typeof originalSuccess === "function" ? originalSuccess(response) : response;
            };
            options.fail = (error) => {
              completeResourceError(request, error);
              return typeof originalFail === "function" ? originalFail(error) : error;
            };
          } catch (error) {
            formatAppLog("error", "at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:137", "[GC-UniPlugin] Harmony uni.request tracking invoke failed:", error);
          }
          return options;
        }
      });
      interceptorInstalled = true;
      formatAppLog("log", "at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:143", "[GC-UniPlugin] Harmony uni.request tracker installed:", platform2);
      return true;
    },
    isTracking() {
      return interceptorInstalled && typeof GCUniPlugin_utsProxy.rum.isHarmonyUniRequestAutoTrackingEnabled === "function" && GCUniPlugin_utsProxy.rum.isHarmonyUniRequestAutoTrackingEnabled();
    }
  };
  const platform = uni.getSystemInfoSync().platform;
  const gcRequest = {
    getUUID() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
        return v.toString(16);
      });
    },
    isEmpty(value) {
      return value === null || value === void 0;
    },
    /// Filter platforms through the filterPlatform parameter. When `enableNativeUserResource` is enabled,
    //  Since uniapp network requests on iOS are implemented using system APIs, all resource data on iOS can be collected together,
    /// At this time, please disable manual collection in uniapp on iOS to prevent duplicate data collection.
    /// Example: ["ios"], iOS side is set not to perform trace tracking and RUM collection.
    request(options) {
      let key = this.getUUID();
      var filter;
      if (this.isEmpty(options.filterPlatform)) {
        filter = false;
      } else {
        filter = options.filterPlatform.includes(platform);
      }
      const shouldCollectResource = !filter && !gcHarmonyNetworkTracking.isTracking();
      var traceHeader = {};
      if (shouldCollectResource) {
        traceHeader = GCUniPlugin_utsProxy.tracer.getTraceHeader({
          "key": key,
          "url": options.url
        });
      }
      traceHeader = Object.assign({}, traceHeader, options.header);
      if (shouldCollectResource) {
        GCUniPlugin_utsProxy.rum.startResource({
          "key": key
        });
      }
      var responseHeader;
      var responseBody;
      var resourceStatus;
      return uni.request({
        ...options,
        header: traceHeader,
        success: (res) => {
          if (shouldCollectResource) {
            responseHeader = res.header;
            responseBody = res.data.toString();
            resourceStatus = res.statusCode;
          }
          if (!this.isEmpty(options.success)) {
            options.success(res);
          }
        },
        fail: (err) => {
          if (shouldCollectResource) {
            responseBody = err.errMsg;
          }
          if (!this.isEmpty(options.fail)) {
            options.fail(err);
          }
        },
        complete: (res) => {
          if (shouldCollectResource) {
            GCUniPlugin_utsProxy.rum.stopResource({
              "key": key
            });
            GCUniPlugin_utsProxy.rum.addResource({
              "key": key,
              "property": {
                "resource_id": key
              },
              "content": {
                "url": options.url,
                "httpMethod": options.method,
                "requestHeader": traceHeader,
                "responseHeader": responseHeader,
                "responseBody": responseBody,
                "resourceStatus": resourceStatus
              }
            });
          }
          if (!this.isEmpty(options.complete) && typeof options.complete === "function") {
            options.complete(res);
          }
        }
      });
    }
  };
  const getCurrentPagePath = () => {
    var _a;
    try {
      return ((_a = getCurrentPages().pop()) == null ? void 0 : _a.route) || null;
    } catch (e) {
      return null;
    }
  };
  const gcPageViewMixinOnly = {
    data() {
      return {
        loadStart: 0
      };
    },
    onLoad() {
      this.loadStart = (/* @__PURE__ */ new Date()).getTime() * 1e6;
    },
    onReady() {
      const loadEnd = (/* @__PURE__ */ new Date()).getTime() * 1e6;
      var duration = 0;
      if (this.loadStart !== null) {
        duration = loadEnd - this.loadStart;
      }
      this.loadStart = null;
      let pagePath = getCurrentPagePath();
      if (pagePath === null) {
        return;
      }
      if (duration >= 0) {
        GCUniPlugin_utsProxy.rum.onCreateView({
          "viewName": pagePath,
          "loadTime": duration
        });
      }
      GCUniPlugin_utsProxy.rum.startView({
        "viewName": pagePath
      });
    },
    onShow() {
      if (this.loadStart === null) {
        let pagePath = getCurrentPagePath();
        if (pagePath !== null) {
          GCUniPlugin_utsProxy.rum.startView({
            "viewName": pagePath
          });
        }
      }
    },
    onUnload() {
      GCUniPlugin_utsProxy.rum.stopView(null);
    }
  };
  class PageMonitor {
    constructor() {
      this.initialized = false;
      this.pageHookInstalled = false;
      this.currentPage = null;
      this.activeViewPath = null;
      this.navBackPagesLength = 0;
      this.pendingPageLoads = /* @__PURE__ */ new Map();
      this.isAppActive = true;
      this.sessionReplayJS = null;
      this.eventListeners = [];
      this.rum = GCUniPlugin_utsProxy.rum;
    }
    // Initialize monitoring
    startTracking(app) {
      if (this.initialized)
        return;
      this.initialized = true;
      formatAppLog("log", "at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:37", "[FTLog] View tracking initialized");
      try {
        this.pageHookInstalled = this.installPageHooks(app);
        this.watchAppLifecycle();
        this.startWatchRouter();
        this.checkInitialPage();
        formatAppLog("log", "at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:52", "[FTLog] View tracking plugin initialized successfully");
      } catch (error) {
        formatAppLog("error", "at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:55", "[FTLog] View tracking plugin initialization failed:", error);
        this.initialized = false;
      }
    }
    installPageHooks(app) {
      const mixin = {
        onLoad() {
          gcViewTracking.handlePageLoad(this);
        },
        onReady() {
          gcViewTracking.handlePageReady(this);
        },
        onShow() {
          gcViewTracking.handlePageShow(this);
        },
        onHide() {
          gcViewTracking.handlePageHide(this);
        },
        onUnload() {
          gcViewTracking.handlePageUnload(this);
        }
      };
      if (app && typeof app.mixin === "function") {
        app.mixin(mixin);
        formatAppLog("log", "at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:80", "[FTLog] View tracking page hooks installed through app.mixin");
        return true;
      }
      formatAppLog("warn", "at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:92", "[FTLog] View tracking page hooks were not installed, falling back to router success timing");
      return false;
    }
    checkInitialPage() {
      if (!this.initialized)
        return;
      const pages = getCurrentPages();
      const currentPage = pages.length > 0 ? pages[pages.length - 1] : null;
      const pagePath = this.getPagePath(currentPage);
      if (!pagePath) {
        return;
      }
      this.currentPage = pagePath;
      formatAppLog("log", "at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:109", "[FTLog] Existing page detected without a load lifecycle:" + pagePath);
      if (!currentPage || !this.pendingPageLoads.has(currentPage.$vm)) {
        this.activateView(pagePath);
      }
    }
    isJSViewTrackingEnabled() {
      return typeof this.rum.isUniAppJSViewTrackingEnabled === "function" && this.rum.isUniAppJSViewTrackingEnabled();
    }
    getCurrentPagePath() {
      const page = getCurrentPages().pop();
      return this.getPagePath(page);
    }
    evalSessionReplayJS(js) {
      this.sessionReplayJS = js;
    }
    // Check initial page and record
    watchAppLifecycle() {
      try {
        const addAppListener = (event, callback) => {
          try {
            if (typeof plus !== "undefined") {
              plus.globalEvent.addEventListener(event, callback);
              this.eventListeners.push({
                event,
                callback
              });
              return true;
            }
            formatAppLog("warn", "at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:142", `[FTLog] Unsupported event listener type: ${event}`);
            return false;
          } catch (e) {
            formatAppLog("error", "at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:145", `[FTLog] Failed to add event listener ${event}:`, e);
            return false;
          }
        };
        addAppListener("resume", () => {
          this.handleAppShow();
        });
        addAppListener("pause", () => {
          this.handleAppHide();
        });
        formatAppLog("log", "at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:160", "[FTLog] watchAppLifecycle internal logic executed successfully");
      } catch (error) {
        formatAppLog("error", "at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:162", "[FTLog] Error executing watchAppLifecycle method:", error);
        throw error;
      }
    }
    handleAppShow() {
      this.isAppActive = true;
      const pages = getCurrentPages();
      const currentPage = pages.length > 0 ? pages[pages.length - 1] : null;
      const pagePath = this.getPagePath(currentPage);
      if (!pagePath)
        return;
      this.currentPage = pagePath;
      formatAppLog("log", "at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:175", "[FTLog] App display detected:" + pagePath);
      if (!currentPage || !this.pendingPageLoads.has(currentPage.$vm)) {
        this.activateView(pagePath);
      }
    }
    handleAppHide() {
      formatAppLog("log", "at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:182", "[FTLog] App hiding detected");
      this.isAppActive = false;
      this.pendingPageLoads.clear();
      this.deactivateView();
    }
    // Monitor route changes
    startWatchRouter() {
      const registerRouteInterceptor = (name) => {
        uni.addInterceptor(name, {
          invoke: (e) => {
            if (!this.pageHookInstalled) {
              this.rumRecordNewView(e.url);
            }
          },
          success: () => {
            if (!this.pageHookInstalled) {
              this.rumStartView();
            }
          }
        });
      };
      registerRouteInterceptor("navigateTo");
      registerRouteInterceptor("redirectTo");
      registerRouteInterceptor("reLaunch");
      registerRouteInterceptor("switchTab");
      uni.addInterceptor("navigateBack", {
        invoke: () => {
          this.navBackPagesLength = getCurrentPages().length;
          if (this.navBackPagesLength > 1) {
            this.currentPage = null;
          }
        },
        success: () => {
          if (!this.pageHookInstalled && this.navBackPagesLength > 1) {
            this.navigateBack();
          }
        }
      });
    }
    // Record new page
    rumRecordNewView(url) {
      const pagePath = this.normalizePagePath(url);
      this.currentPage = pagePath;
    }
    // Stop old page monitoring and start new page monitoring
    rumStopView() {
      this.deactivateView();
    }
    rumStartView() {
      if (!this.isJSViewTrackingEnabled()) {
        return;
      }
      formatAppLog("log", "at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:250", "[FTLog] this.currentPage:" + this.currentPage);
      if (this.currentPage) {
        this.activateView(this.currentPage);
      }
    }
    // Handle back navigation
    navigateBack() {
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const pageInstance = pages[pages.length - 1];
        this.currentPage = this.getPagePath(pageInstance);
        this.activateView(this.currentPage);
      }
    }
    handlePageLoad(vm) {
      if (!this.isPageVm(vm))
        return;
      const pagePath = this.getPagePathFromVm(vm);
      if (!pagePath)
        return;
      this.currentPage = pagePath;
      if (this.isAppActive) {
        this.pendingPageLoads.set(vm, {
          pagePath,
          startTime: Date.now() * 1e6
        });
      }
    }
    handlePageReady(vm) {
      if (!this.isPageVm(vm))
        return;
      const pendingView = this.pendingPageLoads.get(vm);
      if (!pendingView) {
        return;
      }
      this.pendingPageLoads.delete(vm);
      if (!this.isAppActive || !this.isCurrentPageVm(vm)) {
        return;
      }
      const duration = Date.now() * 1e6 - pendingView.startTime;
      if (duration >= 0) {
        this.reportCreateView(pendingView.pagePath, duration);
      }
      this.activateView(pendingView.pagePath);
    }
    handlePageShow(vm) {
      if (!this.isPageVm(vm))
        return;
      const pagePath = this.getPagePathFromVm(vm);
      if (!pagePath)
        return;
      this.currentPage = pagePath;
      if (!this.pendingPageLoads.has(vm)) {
        this.activateView(pagePath);
      }
    }
    handlePageHide(vm) {
      if (!this.isPageVm(vm))
        return;
      const pagePath = this.getPagePathFromVm(vm);
      if (!pagePath)
        return;
      this.pendingPageLoads.delete(vm);
      this.deactivateView(pagePath);
    }
    handlePageUnload(vm) {
      if (!this.isPageVm(vm))
        return;
      const pagePath = this.getPagePathFromVm(vm);
      if (!pagePath)
        return;
      this.pendingPageLoads.delete(vm);
      this.deactivateView(pagePath);
    }
    isPageVm(vm) {
      if (!vm)
        return false;
      const pages = getCurrentPages();
      return pages.some((page) => page.$vm === vm);
    }
    isCurrentPageVm(vm) {
      const pages = getCurrentPages();
      return pages.length > 0 && pages[pages.length - 1].$vm === vm;
    }
    getPagePath(page) {
      if (!page) {
        return null;
      }
      const fullPath = page.$page && page.$page.fullPath;
      if (fullPath) {
        return this.normalizePagePath(fullPath);
      }
      return this.normalizePagePath(page.route);
    }
    getPagePathFromVm(vm) {
      if (!vm)
        return null;
      if (vm.$page && vm.$page.fullPath) {
        return this.normalizePagePath(vm.$page.fullPath);
      }
      if (vm.route) {
        return this.normalizePagePath(vm.route);
      }
      const pages = getCurrentPages();
      const page = pages.find((item) => item.$vm === vm);
      return this.getPagePath(page);
    }
    activateView(pagePath) {
      if (!this.isJSViewTrackingEnabled()) {
        return;
      }
      const normalizedPath = this.normalizePagePath(pagePath);
      if (!normalizedPath || this.activeViewPath === normalizedPath) {
        return;
      }
      const {
        view_name,
        qureyJsonStr
      } = this.parseUrl(normalizedPath);
      if (!view_name) {
        return;
      }
      if (this.activeViewPath) {
        this.rum.stopView(null);
        this.activeViewPath = null;
      }
      formatAppLog("log", "at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:392", "[FTLog] startView：" + view_name);
      this.rum.startView({
        "viewName": view_name,
        "property": {
          "view_url_query": qureyJsonStr
        }
      });
      this.activeViewPath = normalizedPath;
      this.evalJS();
    }
    deactivateView(pagePath = null) {
      const normalizedPath = pagePath ? this.normalizePagePath(pagePath) : this.activeViewPath;
      if (!this.activeViewPath) {
        return;
      }
      if (normalizedPath && normalizedPath !== this.activeViewPath) {
        return;
      }
      this.rum.stopView(null);
      this.activeViewPath = null;
    }
    reportCreateView(pagePath, duration) {
      if (!this.isJSViewTrackingEnabled()) {
        return;
      }
      const {
        view_name
      } = this.parseUrl(pagePath);
      if (!view_name) {
        return;
      }
      this.rum.onCreateView({
        "viewName": view_name,
        "loadTime": duration
      });
    }
    normalizePagePath(url) {
      if (!url || typeof url !== "string") {
        return null;
      }
      let normalizedUrl = url.trim();
      if (!normalizedUrl) {
        return null;
      }
      if (normalizedUrl.startsWith("./")) {
        normalizedUrl = normalizedUrl.slice(2);
      }
      if (normalizedUrl.charAt(0) === "/") {
        normalizedUrl = normalizedUrl.slice(1);
      }
      return normalizedUrl;
    }
    parseUrl(url) {
      const view_url_query = {};
      let view_name = "";
      const normalizedUrl = this.normalizePagePath(url);
      if (normalizedUrl) {
        const urlParts = normalizedUrl.split("?");
        view_name = urlParts[0];
        if (urlParts.length > 1) {
          const queryString = urlParts[1];
          const params = queryString.split("&");
          params.forEach((param) => {
            const [key, value] = param.split("=");
            if (key) {
              view_url_query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : "";
            }
          });
        }
      }
      const qureyJsonStr = JSON.stringify(view_url_query);
      return {
        view_name,
        qureyJsonStr
      };
    }
    evalJS() {
      var pages = getCurrentPages();
      if (pages.length > 0 && this.sessionReplayJS) {
        let pageInstance = pages[pages.length - 1];
        let webView = pageInstance.$getAppWebview();
        if (webView) {
          webView.evalJS(this.buildSessionReplayInjectionJS());
        }
      }
    }
    buildSessionReplayInjectionJS() {
      const sessionReplayJS = this.sessionReplayJS;
      return `
;(function () {
	var stateKey = '__GC_UNI_SESSION_REPLAY_BOOTSTRAP_STATE__';
	if (window[stateKey] === 'waiting' || window[stateKey] === 'started') {
		return;
	}
	window[stateKey] = 'waiting';
	var attempt = 0;
	var maxAttempts = 200;

	function hasRecordsBridge() {
		var bridge = window.FTWebViewJavascriptBridge;
		if (!bridge || typeof bridge.getCapabilities !== 'function') {
			return false;
		}
		var capabilities = bridge.getCapabilities();
		if (Array.isArray(capabilities)) {
			return capabilities.indexOf('records') !== -1;
		}
		return typeof capabilities === 'string' && capabilities.indexOf('records') !== -1;
	}

	function startSessionReplay() {
		try {
			(function () {
${sessionReplayJS}
			}).call(window);
			window[stateKey] = 'started';
		} catch (error) {
			window[stateKey] = null;
			__f__('error','at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:518','[FTLog] Session Replay Web SDK injection failed:', error);
		}
	}

	function waitForBridge() {
		if (hasRecordsBridge()) {
			startSessionReplay();
			return;
		}
		attempt += 1;
		if (attempt < maxAttempts) {
			setTimeout(waitForBridge, 50);
			return;
		}
		window[stateKey] = null;
		__f__('warn','at uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js:533','[FTLog] Session Replay Web SDK injection skipped because the Native records bridge is unavailable.');
	}

	waitForBridge();
})();`;
    }
  }
  const gcViewTracking = new PageMonitor();
  gcActionTracking.startTracking();
  const SERVER_URL = "http://127.0.0.1:9529";
  const CLIENT_TOKEN = "";
  const ANDROID_APP_ID = "android_uniapp_app_id";
  const IOS_APP_ID = "guance_ios_uniapp_id";
  const HARMONY_APP_ID = "com_uniapp_harmony";
  const Utils = {
    getUUID() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
        return v.toString(16);
      });
    },
    request(requestUrl2, header = {}) {
      gcRequest.request({
        url: requestUrl2,
        header,
        success() {
          formatAppLog("log", "at utils.js:23", "success");
        },
        complete() {
          formatAppLog("log", "at utils.js:26", "complete");
        }
      });
    },
    rumRequest(requestUrl2, method, header = {}) {
      gcRequest.request({
        url: requestUrl2,
        method,
        header,
        filterPlatform: ["ios"],
        timeout: 3e4,
        success(res) {
          formatAppLog("log", "at utils.js:38", "success:" + JSON.stringify(res));
        },
        fail(err) {
          formatAppLog("log", "at utils.js:41", "fail:" + JSON.stringify(err));
        },
        complete(res) {
          formatAppLog("log", "at utils.js:44", "complete:" + JSON.stringify(res));
        }
      });
    }
  };
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$b = {
    data() {
      return {};
    },
    onReady() {
      formatAppLog("log", "at pages/index/index.vue:41", "index onReady");
    },
    methods: {
      bindUser() {
        GCUniPlugin_utsProxy.mobileAgent.bindRUMUserData({
          "userId": "Test userId",
          "userName": "Test name",
          "userEmail": "test@123.com",
          "extra": {
            "age": "20"
          }
        });
      },
      unbindUser() {
        GCUniPlugin_utsProxy.mobileAgent.unbindRUMUserData();
      },
      appendGlobalContext() {
        GCUniPlugin_utsProxy.mobileAgent.appendGlobalContext({
          "ft_global_key": "ft_global_value"
        });
      },
      appendRUMGlobalContext() {
        GCUniPlugin_utsProxy.mobileAgent.appendRUMGlobalContext({
          "ft_global_rum_key": "ft_global_rum_value"
        });
      },
      appendLogGlobalContext() {
        GCUniPlugin_utsProxy.mobileAgent.appendLogGlobalContext({
          "ft_global_log_key": "ft_global_log_value"
        });
      },
      appendBridgeContext() {
        GCUniPlugin_utsProxy.mobileAgent.appendBridgeContext({
          "ft_bridge_context": "ft_bridge_context_value"
        });
      },
      flushSyncData() {
        GCUniPlugin_utsProxy.mobileAgent.flushSyncData();
      },
      clearAllData() {
        GCUniPlugin_utsProxy.mobileAgent.clearAllData();
      },
      interfaceConfigSmokeTest() {
        GCUniPlugin_utsProxy.mobileAgent.sdkConfig({
          datawayUrl: SERVER_URL,
          clientToken: CLIENT_TOKEN,
          env: "common",
          debug: true,
          service: "df_rum_android_interface",
          autoSync: true,
          syncPageSize: 10,
          syncSleepTime: 100,
          enableDataIntegerCompatible: true,
          compressIntakeRequests: false,
          enableLimitWithDbSize: true,
          dbDiscardStrategy: "discardOldest",
          globalContext: {
            interface_sdk_globalContext: "interface_sdk_globalContext"
          }
        });
        GCUniPlugin_utsProxy.rum.setConfig({
          androidAppId: ANDROID_APP_ID,
          iOSAppId: IOS_APP_ID,
          harmonyAppId: HARMONY_APP_ID,
          sampleRate: 1,
          sessionOnErrorSampleRate: 1,
          enableNativeUserAction: true,
          enableNativeUserView: true,
          enableNativeUserResource: true,
          enableResourceHostIP: true,
          enableTrackNativeCrash: true,
          enableTrackNativeAppANR: true,
          enableTrackNativeFreeze: true,
          nativeFreezeDurationMs: 400,
          errorMonitorType: ["cpu", "memory"],
          deviceMonitorType: ["cpu", "memory", "fps"],
          detectFrequency: "frequent",
          rumDiscardStrategy: "discardOldest",
          rumCacheLimitCount: 1e3,
          enableTraceWebView: true,
          allowWebViewHost: [],
          globalContext: {
            interface_rum_globalContext: "interface_rum_globalContext"
          }
        });
        GCUniPlugin_utsProxy.logger.setConfig({
          sampleRate: 1,
          enableLinkRumData: true,
          enableCustomLog: true,
          discardStrategy: "discardOldest",
          logLevelFilters: ["info", "warning", "error", "critical", "ok"],
          logCacheLimitCount: 1e3,
          globalContext: {
            interface_logger_globalContext: "interface_logger_globalContext"
          }
        });
        GCUniPlugin_utsProxy.tracer.setConfig({
          sampleRate: 1,
          traceType: "traceparent",
          enableLinkRUMData: true
        });
        GCUniPlugin_utsProxy.logger.logging({
          content: "Interface Config Smoke Test",
          status: "debug",
          property: {
            interface_config_smoke_test: "passed"
          }
        });
        const header = GCUniPlugin_utsProxy.tracer.getTraceHeader({
          key: "interface-config-smoke-test",
          url: "https://httpbin.org/status/200"
        });
        formatAppLog("log", "at pages/index/index.vue:153", "Interface Config Smoke Test header:" + JSON.stringify(header));
      },
      manuallySetApplicationStart() {
        GCUniPlugin_utsProxy.mobileAgent.manuallySetApplicationStart();
      },
      shutDown() {
        GCUniPlugin_utsProxy.mobileAgent.shutDown();
      },
      navigatorToLogPage() {
        uni.navigateTo({
          url: "../logging/logging?id=123&name=test"
        });
      }
    }
  };
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "btn-list" }, [
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[0] || (_cache[0] = ($event) => $options.bindUser())
      }, "Bind User"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[1] || (_cache[1] = ($event) => $options.unbindUser())
      }, "Unbind User"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[2] || (_cache[2] = ($event) => $options.appendGlobalContext())
      }, "appendGlobalContext"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[3] || (_cache[3] = ($event) => $options.appendRUMGlobalContext())
      }, "appendRUMGlobalContext"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[4] || (_cache[4] = ($event) => $options.appendLogGlobalContext())
      }, "appendLogGlobalContext"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[5] || (_cache[5] = ($event) => $options.appendBridgeContext())
      }, "appendBridgeContext"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[6] || (_cache[6] = ($event) => $options.flushSyncData())
      }, "Manual Data Sync"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[7] || (_cache[7] = ($event) => $options.clearAllData())
      }, "Clear Unsynchronized Local Data"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[8] || (_cache[8] = ($event) => $options.interfaceConfigSmokeTest())
      }, "Interface Config Smoke Test"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[9] || (_cache[9] = ($event) => $options.manuallySetApplicationStart())
      }, "Manual Application Start"),
      vue.createElementVNode("button", {
        type: "warn",
        onClick: _cache[10] || (_cache[10] = ($event) => $options.shutDown())
      }, "SDK Shutdown"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[11] || (_cache[11] = ($event) => $options.navigatorToLogPage())
      }, "Log Output"),
      vue.createElementVNode("navigator", { url: "../tracing/tracing" }, [
        vue.createElementVNode("button", { type: "primary" }, "Network Link Tracing")
      ]),
      vue.createElementVNode("navigator", { url: "../rum/rum" }, [
        vue.createElementVNode("button", { type: "primary" }, "RUM Data Collection")
      ]),
      vue.createElementVNode("navigator", { url: "../webview/webView" }, [
        vue.createElementVNode("button", { type: "primary" }, "WebView")
      ])
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$a], ["__file", "/Users/zhuyun/Desktop/guance/ft-sdk-uniapp-native-plugin/Hbuilder_Example/pages/index/index.vue"]]);
  const _sfc_main$a = {
    data() {
      return {};
    },
    onLoad() {
      formatAppLog("log", "at pages/rum/rum.vue:28", "rum onLoad");
    },
    onShow() {
      formatAppLog("log", "at pages/rum/rum.vue:31", "rum onShow");
    },
    onReady() {
      formatAppLog("log", "at pages/rum/rum.vue:34", "rum onReady");
    },
    methods: {
      onCreateView() {
        GCUniPlugin_utsProxy.rum.onCreateView({
          "viewName": "custom_rum",
          "loadTime": 1e8
        });
      },
      startView() {
        GCUniPlugin_utsProxy.rum.startView({
          "viewName": "custom_rum",
          "property": {
            "startView_property": "uni_test"
          }
        });
      },
      stopView() {
        GCUniPlugin_utsProxy.rum.stopView({
          "property": {
            "stopView_property": "uni_test"
          }
        });
      },
      startAction() {
        GCUniPlugin_utsProxy.rum.startAction({
          "actionName": "Button",
          "actionType": "click",
          "property": {
            "action_property": "uni_test"
          }
        });
      },
      addAction() {
        GCUniPlugin_utsProxy.rum.addAction({
          "actionName": "addButton",
          "actionType": "click",
          "property": {
            "action_property": "uni_test"
          }
        });
      },
      addError() {
        GCUniPlugin_utsProxy.rum.addError({
          "message": "Error message",
          "stack": "Error stack",
          "property": {
            "error_property": "uni_test"
          }
        });
      },
      consoleError() {
        formatAppLog("error", "at pages/rum/rum.vue:86", "console error");
      },
      uniError() {
        throw new Error("This is a throw error");
      },
      resourceError() {
        Utils.rumRequest("https://httpbin.org/status/400", "GET", {
          "Accept": "application/json",
          "Content-Type": "application/json"
        });
      },
      resource() {
        Utils.rumRequest("https://httpbin.org/status/200", "GET", {
          "Accept": "application/json",
          "Content-Type": "application/json"
        });
      },
      nativeAutoResource() {
        uni.request({
          url: "https://httpbin.org/status/400",
          method: "GET",
          timeout: 3e4,
          success(res) {
            formatAppLog("log", "at pages/rum/rum.vue:110", "native auto resource success:" + JSON.stringify(res));
          },
          fail(err) {
            formatAppLog("log", "at pages/rum/rum.vue:113", "native auto resource fail:" + JSON.stringify(err));
          },
          complete(res) {
            formatAppLog("log", "at pages/rum/rum.vue:116", "native auto resource complete:" + JSON.stringify(res));
          }
        });
      }
    }
  };
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "btn-list" }, [
      vue.createElementVNode("button", {
        class: "btn-success",
        type: "primary",
        onClick: _cache[0] || (_cache[0] = ($event) => $options.onCreateView())
      }, "View OnCreate"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[1] || (_cache[1] = ($event) => $options.startView())
      }, "View Start"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[2] || (_cache[2] = ($event) => $options.stopView())
      }, "View Stop"),
      vue.createElementVNode("navigator", { url: "../rum/rum-view-mixin" }, [
        vue.createElementVNode("button", { type: "primary" }, "View Mixin Example")
      ]),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[3] || (_cache[3] = ($event) => $options.startAction())
      }, "Start Action"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[4] || (_cache[4] = ($event) => $options.addAction())
      }, "Add Action"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[5] || (_cache[5] = ($event) => $options.addError())
      }, "Add Error"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[6] || (_cache[6] = ($event) => $options.uniError())
      }, "Generate an Error"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[7] || (_cache[7] = ($event) => $options.consoleError())
      }, "Generate a Console Error"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[8] || (_cache[8] = ($event) => $options.resource())
      }, "Resource Normal"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[9] || (_cache[9] = ($event) => $options.resourceError())
      }, "Resource Error"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[10] || (_cache[10] = ($event) => $options.nativeAutoResource())
      }, "Resource Native Auto")
    ]);
  }
  const PagesRumRum = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$9], ["__file", "/Users/zhuyun/Desktop/guance/ft-sdk-uniapp-native-plugin/Hbuilder_Example/pages/rum/rum.vue"]]);
  const _sfc_main$9 = {
    data() {
      return {};
    },
    mixins: [gcPageViewMixinOnly],
    methods: {}
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", null, [
      vue.createElementVNode("text", null, "Page mixin method implements rum view, note that it needs to be used separately from GCWatchRouter otherwise view data will be reported repeatedly")
    ]);
  }
  const PagesRumRumViewMixin = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$8], ["__file", "/Users/zhuyun/Desktop/guance/ft-sdk-uniapp-native-plugin/Hbuilder_Example/pages/rum/rum-view-mixin.vue"]]);
  let requestUrl = "http://10.100.64.166:8000/api/user";
  const _sfc_main$8 = {
    data() {
      return {};
    },
    methods: {
      tracing() {
        let key = Utils.getUUID();
        var header = GCUniPlugin_utsProxy.tracer.getTraceHeader({
          "key": key,
          "url": requestUrl
        });
        formatAppLog("log", "at pages/tracing/tracing.vue:24", "Calling getTraceHeader:" + header);
        uni.request({
          url: requestUrl,
          header,
          __gcResourceKey: key
        });
      }
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "btn-list" }, [
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[0] || (_cache[0] = ($event) => $options.tracing())
      }, "Network Link Tracing")
    ]);
  }
  const PagesTracingTracing = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$7], ["__file", "/Users/zhuyun/Desktop/guance/ft-sdk-uniapp-native-plugin/Hbuilder_Example/pages/tracing/tracing.vue"]]);
  const _sfc_main$7 = {
    data() {
      return {};
    },
    methods: {
      log(status) {
        GCUniPlugin_utsProxy.logger.logging({
          "content": `Log Status: ${status}`,
          "status": status,
          "property": {
            "log_property": "uni_test"
          }
        });
      }
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "btn-list" }, [
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[0] || (_cache[0] = ($event) => $options.log("info"))
      }, "Log Status:info"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[1] || (_cache[1] = ($event) => $options.log("warning"))
      }, "Log Status:warning"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[2] || (_cache[2] = ($event) => $options.log("error"))
      }, "Log Status:error"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[3] || (_cache[3] = ($event) => $options.log("critical"))
      }, "Log Status:critical"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[4] || (_cache[4] = ($event) => $options.log("ok"))
      }, "Log Status:ok")
    ]);
  }
  const PagesLoggingLogging = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$6], ["__file", "/Users/zhuyun/Desktop/guance/ft-sdk-uniapp-native-plugin/Hbuilder_Example/pages/logging/logging.vue"]]);
  const _sfc_main$6 = {
    methods: {
      navigateTo() {
        uni.navigateTo({
          url: "/pages/routertest/page"
        });
      },
      reLaunch() {
        uni.reLaunch({
          url: "/pages/routertest/tab3"
        });
      }
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "btn-list" }, [
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[0] || (_cache[0] = ($event) => $options.navigateTo())
      }, "navigateTo"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[1] || (_cache[1] = ($event) => $options.reLaunch())
      }, "reLaunch")
    ]);
  }
  const PagesRoutertestTab2 = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__file", "/Users/zhuyun/Desktop/guance/ft-sdk-uniapp-native-plugin/Hbuilder_Example/pages/routertest/tab2.vue"]]);
  const gcTest_utsProxy = uni.requireUTSPlugin("uni_modules/gc-test");
  const _sfc_main$5 = {
    methods: {
      triggerHarmonyNativeCrash() {
        uni.showModal({
          title: "Trigger Native Crash",
          content: "This test immediately terminates the Harmony process. Reopen the app manually to let the SDK collect the native crash event.",
          confirmText: "Crash",
          success: (result) => {
            if (result.confirm) {
              uni.__createAppCrash();
            }
          }
        });
      },
      triggerHarmonyLongTask() {
        uni.showModal({
          title: "Trigger Long Task",
          content: "This blocks the Harmony UI thread for 3 seconds. enableTrackNativeFreeze must be enabled and nativeFreezeDurationMs must be below 3000.",
          confirmText: "Block 3s",
          success: (result) => {
            if (result.confirm) {
              gcTest_utsProxy.blockHarmonyMainThread(3e3);
            }
          }
        });
      },
      triggerHarmonyNativeANR() {
        uni.showModal({
          title: "Trigger Native ANR",
          content: "This test blocks the Harmony UI thread for 10 seconds. Make sure enableTrackNativeAppANR is enabled before continuing.",
          confirmText: "Block 10s",
          success: (result) => {
            if (result.confirm) {
              gcTest_utsProxy.blockHarmonyMainThread(1e4);
            }
          }
        });
      }
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "btn-list" }, [
      vue.createElementVNode("button", {
        type: "warn",
        onClick: _cache[0] || (_cache[0] = ($event) => $options.triggerHarmonyNativeCrash())
      }, "Trigger Harmony Native Crash"),
      vue.createElementVNode("button", {
        type: "warn",
        onClick: _cache[1] || (_cache[1] = ($event) => $options.triggerHarmonyLongTask())
      }, "Trigger Harmony Long Task (3s)"),
      vue.createElementVNode("button", {
        type: "warn",
        onClick: _cache[2] || (_cache[2] = ($event) => $options.triggerHarmonyNativeANR())
      }, "Trigger Harmony Native ANR (10s)")
    ]);
  }
  const PagesRoutertestTab3 = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__file", "/Users/zhuyun/Desktop/guance/ft-sdk-uniapp-native-plugin/Hbuilder_Example/pages/routertest/tab3.vue"]]);
  const _sfc_main$4 = {};
  function _sfc_render$3(_ctx, _cache) {
    return null;
  }
  const PagesRoutertestTab4 = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__file", "/Users/zhuyun/Desktop/guance/ft-sdk-uniapp-native-plugin/Hbuilder_Example/pages/routertest/tab4.vue"]]);
  const _sfc_main$3 = {
    methods: {
      redirectTo() {
        uni.redirectTo({
          url: "/pages/routertest/page2"
        });
      },
      navigateBack() {
        uni.navigateBack();
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "btn-list" }, [
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[0] || (_cache[0] = ($event) => $options.redirectTo())
      }, "redirectTo"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[1] || (_cache[1] = ($event) => $options.navigateBack())
      }, "navigateBack")
    ]);
  }
  const PagesRoutertestPage = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__file", "/Users/zhuyun/Desktop/guance/ft-sdk-uniapp-native-plugin/Hbuilder_Example/pages/routertest/page.vue"]]);
  const _sfc_main$2 = {
    methods: {
      redirectTo() {
        uni.redirectTo({
          url: "/pages/routertest/page"
        });
      },
      navigateBack() {
        uni.navigateBack();
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "btn-list" }, [
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[0] || (_cache[0] = ($event) => $options.redirectTo())
      }, "redirectTo"),
      vue.createElementVNode("button", {
        type: "primary",
        onClick: _cache[1] || (_cache[1] = ($event) => $options.navigateBack())
      }, "navigateBack")
    ]);
  }
  const PagesRoutertestPage2 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__file", "/Users/zhuyun/Desktop/guance/ft-sdk-uniapp-native-plugin/Hbuilder_Example/pages/routertest/page2.vue"]]);
  const _sfc_main$1 = {
    data() {
      return {
        webviewUrl: "http://10.100.64.166/test/rum/",
        harmonyWebviewOptions: {
          src: "http://10.100.64.166/test/rum/",
          viewName: "webview"
        }
      };
    },
    methods: {
      handleWebviewError(err) {
        uni.showToast({
          title: "The page failed to load. Please check the URL or try again later.",
          icon: "none",
          duration: 3e3
        });
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("embed", {
        class: "harmony-webview",
        tag: "gcwebview",
        options: $data.harmonyWebviewOptions
      }, null, 8, ["options"])
    ]);
  }
  const PagesWebviewWebView = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-23b6bfa6"], ["__file", "/Users/zhuyun/Desktop/guance/ft-sdk-uniapp-native-plugin/Hbuilder_Example/pages/webview/webView.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/rum/rum", PagesRumRum);
  __definePage("pages/rum/rum-view-mixin", PagesRumRumViewMixin);
  __definePage("pages/tracing/tracing", PagesTracingTracing);
  __definePage("pages/logging/logging", PagesLoggingLogging);
  __definePage("pages/routertest/tab2", PagesRoutertestTab2);
  __definePage("pages/routertest/tab3", PagesRoutertestTab3);
  __definePage("pages/routertest/tab4", PagesRoutertestTab4);
  __definePage("pages/routertest/page", PagesRoutertestPage);
  __definePage("pages/routertest/page2", PagesRoutertestPage2);
  __definePage("pages/webview/webView", PagesWebviewWebView);
  uni.requireUTSPlugin("uni_modules/GC-UniSessionReplay");
  function initializeGuanceSDK() {
    {
      formatAppLog("warn", "at sdk-bootstrap.js:28", "[Guance] SDK initialization skipped: configure DATAWAY_URL and CLIENT_TOKEN locally.");
      return;
    }
  }
  const _sfc_main = {
    onLaunch: function() {
      initializeGuanceSDK();
    },
    onShow: function() {
      gcViewTracking.handleAppShow();
    },
    onHide: function() {
      gcViewTracking.handleAppHide();
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "/Users/zhuyun/Desktop/guance/ft-sdk-uniapp-native-plugin/Hbuilder_Example/App.vue"]]);
  initializeGuanceSDK();
  function createApp() {
    const app = vue.createVueApp(App);
    gcViewTracking.startTracking(app);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
