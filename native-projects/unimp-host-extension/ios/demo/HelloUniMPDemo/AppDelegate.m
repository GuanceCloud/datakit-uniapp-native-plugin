#import "AppDelegate.h"
#import <GuanceSDK/GuanceSDK.h>
#import "DCUniMP.h"
#import "WXSDKEngine.h"

static void GCRegisterModule(NSString *moduleName, NSString *className) {
    Class moduleClass = NSClassFromString(className);
    NSCAssert(moduleClass, @"Missing UniMP host extension class: %@", className);
    [WXSDKEngine registerModule:moduleName withClass:moduleClass];
}

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    NSMutableDictionary *options =
        [NSMutableDictionary dictionaryWithDictionary:launchOptions ?: @{}];
    options[@"debug"] = @YES;

    [DCUniMPSDKEngine initSDKEnvironmentWithLaunchOptions:options];
    [self initNativeGuanceSDK];
    // These IDs are the public contract used by GC-JSPlugin in the WGT.
    GCRegisterModule(@"GCUniPlugin-MobileAgent", @"FTMobileUniModule");
    GCRegisterModule(@"GCUniPlugin-RUM", @"FTRUMModule");
    GCRegisterModule(@"GCUniPlugin-Logger", @"FTLogModule");
    GCRegisterModule(@"GCUniPlugin-Tracer", @"FTTracerModule");

    return YES;
}
- (void)initNativeGuanceSDK{
    FTSDKConfig *config = [[FTSDKConfig alloc]initWithDatawayUrl:@"http://open-dataway.cn" clientToken:@"client-token"];
    config.enableSDKDebugLog = YES;
    config.autoSync = YES;
    [config setEnvWithType:FTEnvPre];
    config.globalContext = @{@"example_id":@"example_id_1"};//eg.
    config.groupIdentifiers = @[@"group.com.ft.widget.demo"];
    config.remoteConfiguration = YES;

    // Enable rum
    FTRumConfig *rumConfig = [[FTRumConfig alloc]initWithAppid:@"guance_ios_uniapp_id"];
    rumConfig.enableTrackAppCrash = YES;
    rumConfig.enableTrackAppANR = YES;
    rumConfig.enableTrackAppFreeze = YES;
    rumConfig.enableTraceUserAction = YES;
    rumConfig.enableTraceUserView = YES;
    rumConfig.enableTraceUserResource = YES;
//        rumConfig.resourceUrlHandler = ^(NSURL *url){
//            return NO;
//        };
    rumConfig.crashMonitoring = FTCrashMonitorTypeAll;
    rumConfig.errorMonitorType = FTErrorMonitorAll;
    rumConfig.deviceMetricsMonitorType = FTDeviceMetricsMonitorAll;
    rumConfig.monitorFrequency = FTMonitorFrequencyRare;
    FTLoggerConfig *loggerConfig = [[FTLoggerConfig alloc]init];
    loggerConfig.enableCustomLog = YES;
    loggerConfig.enableLinkRumData = YES;
    loggerConfig.printCustomLogToConsole = YES;
    loggerConfig.logLevelFilter = @[@(FTStatusError),@(FTStatusCritical)];
    loggerConfig.discardType = FTDiscardOldest;
    loggerConfig.globalContext = @{@"log_id":@"log_id_1"};//eg.
    FTTraceConfig *traceConfig = [[FTTraceConfig alloc]init];
    traceConfig.enableLinkRumData = YES;
    traceConfig.networkTraceType = FTNetworkTraceTypeDDtrace;
    traceConfig.enableAutoTrace = YES;
    [FTMobileAgent startWithConfigOptions:config];
    [[FTMobileAgent sharedInstance] startRumWithConfigOptions:rumConfig];
    [[FTMobileAgent sharedInstance] startLoggerWithConfigOptions:loggerConfig];
    [[FTMobileAgent sharedInstance] startTraceWithConfigOptions:traceConfig];
}
- (void)applicationDidBecomeActive:(UIApplication *)application {
    [DCUniMPSDKEngine applicationDidBecomeActive:application];
}

- (void)applicationWillResignActive:(UIApplication *)application {
    [DCUniMPSDKEngine applicationWillResignActive:application];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    [DCUniMPSDKEngine applicationDidEnterBackground:application];
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
    [DCUniMPSDKEngine applicationWillEnterForeground:application];
}

- (void)applicationWillTerminate:(UIApplication *)application {
    [DCUniMPSDKEngine destory];
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options {
    [DCUniMPSDKEngine application:application openURL:url options:options];
    return YES;
}

- (BOOL)application:(UIApplication *)application
    continueUserActivity:(NSUserActivity *)userActivity
      restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> *))restorationHandler {
    [DCUniMPSDKEngine application:application continueUserActivity:userActivity];
    return YES;
}

- (void)application:(UIApplication *)application
    didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
    [DCUniMPSDKEngine application:application
        didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application
    didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
    [DCUniMPSDKEngine application:application
        didFailToRegisterForRemoteNotificationsWithError:error];
}

- (void)application:(UIApplication *)application
    didReceiveRemoteNotification:(NSDictionary *)userInfo
          fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
    [DCUniMPSDKEngine application:application didReceiveRemoteNotification:userInfo];
    completionHandler(UIBackgroundFetchResultNewData);
}

- (void)application:(UIApplication *)application
    didReceiveLocalNotification:(UILocalNotification *)notification {
    [DCUniMPSDKEngine application:application didReceiveLocalNotification:notification];
}

@end
