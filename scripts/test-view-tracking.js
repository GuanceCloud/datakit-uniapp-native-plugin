const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(
    path.join(
        root,
        'Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js'
    ),
    'utf8'
);
const classSource = source.slice(
    source.indexOf('class PageMonitor'),
    source.indexOf('// Export singleton instance')
);

function createHarness() {
    let now = 0;
    let pages = [];
    let nextTimerId = 1;
    const calls = [];
    const logs = [];
    const interceptors = {};
    const timers = new Map();
    const context = {
        console: {
            log(...args) {
                logs.push(args);
            },
            warn(...args) {
                logs.push(args);
            },
            error(...args) {
                logs.push(args);
            }
        },
        Date: {
            now: () => now
        },
        gcRum: {},
        getCurrentPages: () => pages,
        setTimeout(callback) {
            const id = nextTimerId++;
            timers.set(id, callback);
            return id;
        },
        clearTimeout(id) {
            timers.delete(id);
        },
        uni: {
            addInterceptor(name, interceptor) {
                interceptors[name] = interceptor;
            }
        },
        Vue: null
    };
    vm.createContext(context);
    vm.runInContext(
        `const LOAD_TIME_UNAVAILABLE = -1;
         const RELOAD_LOAD_TIME = 0;
         const LIFECYCLE_FALLBACK_TIMEOUT_MS = 5000;
         const PAGE_READY_FALLBACK_TIMEOUT_MS = 5000;
         ${classSource}
         this.PageMonitor = PageMonitor;`,
        context
    );

    const monitor = new context.PageMonitor();
    monitor.rum = {
        onCreateView(params) {
            calls.push({ type: 'create', params });
        },
        startView(params) {
            calls.push({ type: 'start', params });
        },
        stopView(params) {
            calls.push({ type: 'stop', params });
        }
    };
    context.gcViewTracking = monitor;

    return {
        monitor,
        calls,
        logs,
        interceptors,
        context,
        setNow(value) {
            now = value;
        },
        setPages(value) {
            pages = value;
        },
        runTimers() {
            const callbacks = Array.from(timers.values());
            timers.clear();
            callbacks.forEach(callback => callback());
        }
    };
}

function makePage(fullPath, options = {}) {
    const route = fullPath.split('?')[0].replace(/^\//, '');
    const pageVm = options.pageVm || {
        route,
        $page: {
            fullPath
        }
    };
    let evalCount = 0;
    const webView = {
        evalJS(js) {
            evalCount += 1;
            calls.push(js);
        }
    };
    const calls = [];
    const page = {
        route,
        $vm: pageVm,
        $page: options.pageHasFullPath === false ? undefined : {
            fullPath
        },
        $getAppWebview: options.hasWebView === false ? undefined : () => webView
    };
    if (options.vmHasFullPath === false) {
        delete pageVm.$page;
    }
    return {
        page,
        pageVm,
        webView,
        evalCalls: calls,
        getEvalCount: () => evalCount
    };
}

function callsOfType(harness, type) {
    return harness.calls.filter(call => call.type === type);
}

function testNormalShowBeforeReady() {
    const harness = createHarness();
    const fixture = makePage('/pages/detail?id=42');
    harness.setPages([fixture.page]);

    harness.setNow(100);
    harness.monitor.handlePageLoad(fixture.pageVm);
    harness.setNow(110);
    harness.monitor.handlePageShow(fixture.pageVm);
    assert.deepStrictEqual(harness.calls, []);

    harness.setNow(145);
    harness.monitor.handlePageReady(fixture.pageVm);
    assert.deepStrictEqual(harness.calls.map(call => call.type), ['create', 'start']);
    assert.strictEqual(harness.calls[0].params.loadTime, 45000000);
    assert.strictEqual(harness.calls[0].params.viewName, 'pages/detail');
    assert.deepStrictEqual(
        JSON.parse(harness.calls[1].params.property.view_url_query),
        { id: '42' }
    );

    harness.monitor.handlePageHide(fixture.pageVm);
    harness.monitor.handlePageShow(fixture.pageVm);
    assert.deepStrictEqual(
        harness.calls.map(call => call.type),
        ['create', 'start', 'stop', 'create', 'start']
    );
    assert.deepStrictEqual(
        callsOfType(harness, 'create').map(call => call.params.loadTime),
        [45000000, 0]
    );
}

function testReadyBeforeShowAndPreloadedPage() {
    const harness = createHarness();
    const fixture = makePage('/pages/preloaded?source=cache');
    harness.setPages([fixture.page]);

    harness.setNow(200);
    harness.monitor.handlePageLoad(fixture.pageVm);
    harness.setNow(230);
    harness.monitor.handlePageReady(fixture.pageVm);
    assert.deepStrictEqual(harness.calls, []);

    // Time spent waiting between preload completion and display is not load time.
    harness.setNow(1000);
    harness.monitor.handlePageShow(fixture.pageVm);
    assert.deepStrictEqual(harness.calls.map(call => call.type), ['create', 'start']);
    assert.strictEqual(harness.calls[0].params.loadTime, 30000000);
}

function testUnavailableLoadTime() {
    const harness = createHarness();
    const fixture = makePage('/pages/late-start');
    harness.setPages([fixture.page]);

    harness.monitor.handlePageShow(fixture.pageVm);
    assert.deepStrictEqual(harness.calls.map(call => call.type), ['create', 'start']);
    assert.strictEqual(harness.calls[0].params.loadTime, -1);
}

function testMissingReadyWaitsThenUsesUnavailableLoadTime() {
    const harness = createHarness();
    const fixture = makePage('/pages/missing-ready');
    harness.setPages([fixture.page]);

    harness.setNow(250);
    harness.monitor.handlePageLoad(fixture.pageVm);
    harness.setNow(265);
    harness.monitor.handlePageShow(fixture.pageVm);

    assert.deepStrictEqual(harness.calls, []);
    harness.runTimers();
    assert.deepStrictEqual(harness.calls.map(call => call.type), ['create', 'start']);
    assert.strictEqual(harness.calls[0].params.loadTime, -1);
}

function testHideBeforeReadyCancelsFallbackAndKeepsReadyDuration() {
    const harness = createHarness();
    const fixture = makePage('/pages/hidden-before-ready');
    harness.setPages([fixture.page]);

    harness.setNow(100);
    harness.monitor.handlePageLoad(fixture.pageVm);
    harness.setNow(110);
    harness.monitor.handlePageShow(fixture.pageVm);
    harness.monitor.handlePageHide(fixture.pageVm);
    harness.runTimers();
    assert.deepStrictEqual(harness.calls, []);

    harness.setNow(140);
    harness.monitor.handlePageReady(fixture.pageVm);
    assert.deepStrictEqual(harness.calls, []);

    harness.setNow(200);
    harness.monitor.handlePageShow(fixture.pageVm);
    assert.deepStrictEqual(harness.calls.map(call => call.type), ['create', 'start']);
    assert.strictEqual(harness.calls[0].params.loadTime, 40000000);
}

function testUnloadBeforeReadyCancelsFallbackAndRemovesState() {
    const harness = createHarness();
    const fixture = makePage('/pages/unloaded-before-ready');
    harness.setPages([fixture.page]);

    harness.setNow(300);
    harness.monitor.handlePageLoad(fixture.pageVm);
    harness.monitor.handlePageShow(fixture.pageVm);
    harness.monitor.handlePageUnload(fixture.pageVm);
    harness.runTimers();

    assert.deepStrictEqual(harness.calls, []);
    assert.strictEqual(harness.monitor.pageStateByVm.get(fixture.pageVm), undefined);
    assert.strictEqual(
        harness.monitor.latestPageStateByViewKey['pages/unloaded-before-ready'],
        undefined
    );
}

function testReLaunchUsesReadyMinusLoadAndKeepsQuery() {
    const harness = createHarness();
    harness.monitor.pageHookInstalled = true;
    harness.monitor.startWatchRouter();

    const fixture = makePage('/pages/relaunch?id=7&token=a%3Db', {
        vmHasFullPath: false,
        pageHasFullPath: false
    });
    harness.setPages([fixture.page]);

    harness.interceptors.reLaunch.invoke({
        url: '/pages/relaunch?id=7&token=a%3Db'
    });
    harness.setNow(300);
    harness.monitor.handlePageLoad(fixture.pageVm);
    harness.setNow(320);
    harness.monitor.handlePageShow(fixture.pageVm);
    assert.deepStrictEqual(harness.calls, []);
    harness.setNow(350);
    harness.monitor.handlePageReady(fixture.pageVm);
    harness.interceptors.reLaunch.success();

    assert.deepStrictEqual(harness.calls.map(call => call.type), ['create', 'start']);
    assert.strictEqual(harness.calls[0].params.loadTime, 50000000);
    assert.deepStrictEqual(
        JSON.parse(harness.calls[1].params.property.view_url_query),
        { id: '7', token: 'a=b' }
    );
}

function testFailedNavigationIsDiscarded() {
    const harness = createHarness();
    harness.monitor.pageHookInstalled = true;
    harness.monitor.startWatchRouter();

    harness.interceptors.navigateTo.invoke({ url: '/pages/missing?id=1' });
    assert.strictEqual(harness.monitor.pendingRouteTransactions.length, 1);
    harness.interceptors.navigateTo.fail();
    assert.strictEqual(harness.monitor.pendingRouteTransactions.length, 0);
    assert.strictEqual(harness.monitor.currentPage, null);
    assert.deepStrictEqual(harness.calls, []);
}

function testNoLifecycleFallbackUsesUnavailableThenReloadZero() {
    const harness = createHarness();
    harness.monitor.pageHookInstalled = false;
    harness.monitor.startWatchRouter();

    const fixture = makePage('/pages/fallback?id=9');
    harness.setPages([fixture.page]);
    harness.interceptors.navigateTo.invoke({ url: '/pages/fallback?id=9' });
    harness.interceptors.navigateTo.success();
    harness.monitor.handlePageHide(fixture.pageVm);
    harness.monitor.startCurrentPageWithoutLifecycle();

    assert.deepStrictEqual(
        harness.calls.map(call => call.type),
        ['create', 'start', 'stop', 'create', 'start']
    );
    assert.deepStrictEqual(
        callsOfType(harness, 'create').map(call => call.params.loadTime),
        [-1, 0]
    );
}

function testInstalledHookFallbackUsesUnavailableWhenNoEventArrives() {
    const harness = createHarness();
    harness.monitor.pageHookInstalled = true;
    harness.monitor.startWatchRouter();

    const fixture = makePage('/pages/no-hook-event?id=3');
    harness.setPages([fixture.page]);
    harness.interceptors.navigateTo.invoke({ url: '/pages/no-hook-event?id=3' });
    harness.interceptors.navigateTo.success();
    assert.deepStrictEqual(harness.calls, []);
    harness.runTimers();

    assert.deepStrictEqual(harness.calls.map(call => call.type), ['create', 'start']);
    assert.strictEqual(harness.calls[0].params.loadTime, -1);
}

function testUnloadRemovesPageState() {
    const harness = createHarness();
    const fixture = makePage('/pages/disposable');
    harness.setPages([fixture.page]);

    harness.setNow(600);
    harness.monitor.handlePageLoad(fixture.pageVm);
    harness.monitor.handlePageShow(fixture.pageVm);
    harness.setNow(610);
    harness.monitor.handlePageReady(fixture.pageVm);
    harness.monitor.handlePageUnload(fixture.pageVm);

    assert.strictEqual(harness.monitor.pageStateByVm.get(fixture.pageVm), undefined);
    assert.strictEqual(
        harness.monitor.latestPageStateByViewKey['pages/disposable'],
        undefined
    );
    assert.deepStrictEqual(
        harness.calls.map(call => call.type),
        ['create', 'start', 'stop']
    );
}

function testSameRouteStackRestoresUnderlyingPageState() {
    const harness = createHarness();
    const first = makePage('/pages/detail?id=1');
    const second = makePage('/pages/detail?id=2');

    harness.setPages([first.page]);
    harness.setNow(700);
    harness.monitor.handlePageLoad(first.pageVm);
    harness.setNow(710);
    harness.monitor.handlePageShow(first.pageVm);
    harness.setNow(715);
    harness.monitor.handlePageReady(first.pageVm);
    harness.monitor.handlePageHide(first.pageVm);

    harness.setPages([first.page, second.page]);
    harness.setNow(720);
    harness.monitor.handlePageLoad(second.pageVm);
    harness.setNow(730);
    harness.monitor.handlePageShow(second.pageVm);
    harness.setNow(735);
    harness.monitor.handlePageReady(second.pageVm);
    harness.monitor.handlePageUnload(second.pageVm);

    harness.setPages([first.page]);
    harness.monitor.handlePageShow(first.pageVm);
    const restored = harness.monitor.pageStateByVm.get(first.pageVm);
    assert.strictEqual(
        harness.monitor.latestPageStateByViewKey['pages/detail'],
        restored
    );
    assert.deepStrictEqual(
        callsOfType(harness, 'create').map(call => call.params.loadTime),
        [15000000, 15000000, 0]
    );
}

function testPauseResumeAndPageShowAreDeduplicated() {
    const harness = createHarness();
    const fixture = makePage('/pages/home');
    harness.setPages([fixture.page]);

    harness.setNow(400);
    harness.monitor.handlePageLoad(fixture.pageVm);
    harness.setNow(420);
    harness.monitor.handlePageReady(fixture.pageVm);
    harness.monitor.handlePageShow(fixture.pageVm);
    harness.monitor.handleAppPause();
    harness.monitor.handleAppResume();
    harness.monitor.handlePageShow(fixture.pageVm);

    assert.deepStrictEqual(
        harness.calls.map(call => call.type),
        ['create', 'start', 'stop', 'create', 'start']
    );
    assert.deepStrictEqual(
        callsOfType(harness, 'create').map(call => call.params.loadTime),
        [20000000, 0]
    );
}

function testSessionReplayInjectionDecision() {
    const harness = createHarness();
    const fixture = makePage('/pages/replay?enabled=true');
    harness.setPages([fixture.page]);

    harness.setNow(500);
    harness.monitor.handlePageLoad(fixture.pageVm);
    harness.setNow(510);
    harness.monitor.handlePageReady(fixture.pageVm);
    harness.monitor.handlePageShow(fixture.pageVm);
    assert.strictEqual(fixture.getEvalCount(), 0);

    harness.monitor.evalSessionReplayJS('window.startReplay()');
    harness.monitor.handlePageHide(fixture.pageVm);
    harness.monitor.handlePageShow(fixture.pageVm);
    assert.strictEqual(fixture.getEvalCount(), 1);
    assert.deepStrictEqual(fixture.evalCalls, ['window.startReplay()']);

    harness.monitor.handlePageHide(fixture.pageVm);
    harness.monitor.handlePageShow(fixture.pageVm);
    assert.strictEqual(fixture.getEvalCount(), 1);
}

function testVue2AndVue3MixinInstallation() {
    const vue3Harness = createHarness();
    let vue3Mixin = null;
    assert.strictEqual(vue3Harness.monitor.installPageHooks({
        mixin(value) {
            vue3Mixin = value;
        }
    }), true);
    assert.deepStrictEqual(
        Object.keys(vue3Mixin),
        ['onLoad', 'onReady', 'onShow', 'onHide', 'onUnload']
    );

    const vue2Harness = createHarness();
    let vue2Mixin = null;
    vue2Harness.context.Vue = {
        mixin(value) {
            vue2Mixin = value;
        }
    };
    assert.strictEqual(vue2Harness.monitor.installPageHooks(), true);
    assert.deepStrictEqual(Object.keys(vue2Mixin), Object.keys(vue3Mixin));
}

function testAppLifecycleVmIsIgnoredWithoutReadingPageGetter() {
    const harness = createHarness();
    let pageGetterReadCount = 0;
    const appVm = {
        $options: {
            mpType: 'app'
        }
    };
    Object.defineProperty(appVm, '$page', {
        get() {
            pageGetterReadCount += 1;
            throw new TypeError('App root has no page scope');
        }
    });

    harness.monitor.handlePageLoad(appVm);
    harness.monitor.handlePageReady(appVm);
    harness.monitor.handlePageShow(appVm);
    harness.monitor.handlePageHide(appVm);
    harness.monitor.handlePageUnload(appVm);

    assert.strictEqual(pageGetterReadCount, 0);
    assert.deepStrictEqual(harness.calls, []);
}

function testTransientPageGetterFallsBackToRoute() {
    const harness = createHarness();
    const pageVm = {
        route: 'pages/transient'
    };
    Object.defineProperty(pageVm, '$page', {
        get() {
            throw new TypeError('Page scope is not attached yet');
        }
    });
    const fixture = makePage('/pages/transient', {
        pageVm,
        pageHasFullPath: false
    });
    harness.setPages([fixture.page]);

    harness.setNow(800);
    harness.monitor.handlePageLoad(pageVm);
    harness.setNow(825);
    harness.monitor.handlePageReady(pageVm);
    harness.monitor.handlePageShow(pageVm);

    assert.deepStrictEqual(harness.calls.map(call => call.type), ['create', 'start']);
    assert.strictEqual(harness.calls[0].params.loadTime, 25000000);
}

function testDebugLoggingCanBeToggled() {
    const harness = createHarness();
    const fixture = makePage('/pages/debug?id=1');
    harness.setPages([fixture.page]);

    harness.setNow(1000);
    harness.monitor.handlePageLoad(fixture.pageVm);
    assert.strictEqual(debugEntries(harness).length, 0);

    harness.monitor.setDebugEnabled(true);
    harness.setNow(1010);
    harness.monitor.handlePageShow(fixture.pageVm);
    harness.setNow(1020);
    harness.monitor.handlePageReady(fixture.pageVm);
    harness.setNow(1030);
    harness.monitor.handlePageHide(fixture.pageVm);
    harness.setNow(1040);
    harness.monitor.handlePageShow(fixture.pageVm);
    harness.setNow(1050);
    harness.monitor.handlePageUnload(fixture.pageVm);

    const entries = debugEntries(harness);
    assert.deepStrictEqual(
        entries
            .filter(entry => entry.event === 'lifecycle')
            .map(entry => entry.lifecycle),
        ['onShow', 'onReady', 'onHide', 'onShow', 'onUnload']
    );
    entries.forEach(entry => {
        assert.strictEqual(typeof entry.timestamp, 'number');
    });
    const starts = entries.filter(entry => entry.event === 'startView');
    assert.deepStrictEqual(starts.map(entry => entry.reason), [
        'page:onReady',
        'page:onShow'
    ]);
    assert.deepStrictEqual(starts.map(entry => entry.pagePath), [
        'pages/debug?id=1',
        'pages/debug?id=1'
    ]);
    assert.deepStrictEqual(starts.map(entry => entry.loadTime), [20000000, 0]);
    assert.deepStrictEqual(
        entries
            .filter(entry => entry.event === 'stopView')
            .map(entry => entry.reason),
        ['page:onHide', 'page:onUnload']
    );

    harness.monitor.setDebugEnabled(false);
    const countAfterDisable = debugEntries(harness).length;
    harness.monitor.handlePageShow(fixture.pageVm);
    assert.strictEqual(debugEntries(harness).length, countAfterDisable);
}

function debugEntries(harness) {
    return harness.logs
        .filter(args => args[0] === '[FTLog][ViewTracking][Debug]')
        .map(args => args[1]);
}

testNormalShowBeforeReady();
testReadyBeforeShowAndPreloadedPage();
testUnavailableLoadTime();
testMissingReadyWaitsThenUsesUnavailableLoadTime();
testHideBeforeReadyCancelsFallbackAndKeepsReadyDuration();
testUnloadBeforeReadyCancelsFallbackAndRemovesState();
testReLaunchUsesReadyMinusLoadAndKeepsQuery();
testFailedNavigationIsDiscarded();
testNoLifecycleFallbackUsesUnavailableThenReloadZero();
testInstalledHookFallbackUsesUnavailableWhenNoEventArrives();
testUnloadRemovesPageState();
testSameRouteStackRestoresUnderlyingPageState();
testPauseResumeAndPageShowAreDeduplicated();
testSessionReplayInjectionDecision();
testVue2AndVue3MixinInstallation();
testAppLifecycleVmIsIgnoredWithoutReadingPageGetter();
testTransientPageGetterFallsBackToRoute();
testDebugLoggingCanBeToggled();

console.log('view tracking lifecycle checks passed');
