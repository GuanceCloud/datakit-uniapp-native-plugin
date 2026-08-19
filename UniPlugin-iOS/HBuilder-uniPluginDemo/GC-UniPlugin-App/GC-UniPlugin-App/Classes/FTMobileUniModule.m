//
//  FTMobileUniModule.m
//  GC-UniPlugin-App
//
//  Created by hulilei on 2023/2/3.
//

#import "FTMobileUniModule.h"
#import <GuanceSDK/FTSDKAgent.h>
#import <GuanceSDK/FTSDKConfig.h>
#import <GuanceSDK/FTConstants.h>
#import "FTUniPluginUtils.h"
#if __has_include(<GuanceSDK/FTInnerLog.h>)
#import <GuanceSDK/FTInnerLog.h>
#define FT_UNI_PLUGIN_HAS_INNER_LOG 1
#elif __has_include("FTInnerLog.h")
#import "FTInnerLog.h"
#define FT_UNI_PLUGIN_HAS_INNER_LOG 1
#else
#define FT_UNI_PLUGIN_HAS_INNER_LOG 0
#endif
@implementation FTMobileUniModule
#pragma mark --------- SDK INIT ----------
UNI_EXPORT_METHOD_SYNC(@selector(sdkConfig:))
- (void)sdkConfig:(NSDictionary *)params{
    dispatch_block_t block = ^(){
        NSString *serverUrl = [params valueForKey:@"serverUrl"];
        NSString *datakitUrl = [params valueForKey:@"datakitUrl"];
        datakitUrl = datakitUrl ?:serverUrl;
        NSString *dataWayUrl = [params valueForKey:@"datawayUrl"];
        NSString *clientToken = [params valueForKey:@"clientToken"];
        FTSDKConfig *config;
        if(dataWayUrl && dataWayUrl.length>0 && clientToken && clientToken.length>0){
            config = [[FTSDKConfig alloc]initWithDatawayUrl:dataWayUrl clientToken:clientToken];
        }else if(datakitUrl && datakitUrl.length>0){
            config = [[FTSDKConfig alloc]initWithDatakitUrl:datakitUrl];
        }else{
            config = [[FTSDKConfig alloc]init];
        }
        if([params.allKeys containsObject:@"debug"]){
            NSNumber *debug = params[@"debug"];
            config.enableSDKDebugLog = [debug boolValue];
        }
        if ([params.allKeys containsObject:@"service"]) {
            config.service = params[@"service"];
        }
        if([params.allKeys containsObject:@"env"]){
            id env = params[@"env"];
            if([env isKindOfClass:NSString.class]){
                config.env = env;
            }
        }
        if ([params.allKeys containsObject:@"autoSync"]) {
            config.autoSync = [params[@"autoSync"] boolValue];
        }
        if ([params.allKeys containsObject:@"syncPageSize"]) {
            config.syncPageSize = [params[@"syncPageSize"] intValue];
        }
        if ([params.allKeys containsObject:@"syncSleepTime"]) {
            config.syncSleepTime = [params[@"syncSleepTime"] intValue];
        }
        if ([params.allKeys containsObject:@"enableDataIntegerCompatible"]) {
            config.enableDataIntegerCompatible = [params[@"enableDataIntegerCompatible"] boolValue];
        }
        if ([params.allKeys containsObject:@"compressIntakeRequests"]) {
            config.compressIntakeRequests = [params[@"compressIntakeRequests"] boolValue];
        }
        if ([params.allKeys containsObject:@"dbDiscardStrategy"]){
            NSString *type = params[@"dbDiscardStrategy"];
            if([type isEqualToString:@"discard"]){
                config.dbDiscardType = FTDBDiscard;
            }else if([type isEqualToString:@"discardOldest"]){
                config.dbDiscardType = FTDBDiscardOldest;
            }
        }
        if ([params.allKeys containsObject:@"enableLimitWithDbSize"]){
            config.enableLimitWithDbSize = [params[@"enableLimitWithDbSize"] boolValue];
        }
        if ([params.allKeys containsObject:@"dbCacheLimit"]){
            config.dbCacheLimit = [params[@"dbCacheLimit"] doubleValue];
        }
        if ([params.allKeys containsObject:@"globalContext"]) {
            NSDictionary *globalContext = [params valueForKey:@"globalContext"];
            config.globalContext = globalContext;
        }
        if ([params.allKeys containsObject:@"dataModifier"] && [[params valueForKey:@"dataModifier"] isKindOfClass:NSDictionary.class]) {
            NSDictionary *dataModifierDict = [[params valueForKey:@"dataModifier"] copy];
            config.dataModifier = ^id _Nullable(NSString * _Nonnull key, id  _Nonnull value) {
                if ([dataModifierDict.allKeys containsObject:key]) {
                    return dataModifierDict[key];
                }
                return value;
            };
        }
        if ([params.allKeys containsObject:@"lineDataModifier"] && [[params valueForKey:@"lineDataModifier"] isKindOfClass:NSDictionary.class]) {
            NSDictionary *lineDataModifierDict = [[params valueForKey:@"lineDataModifier"] copy];
            config.lineDataModifier = ^NSDictionary<NSString *,id> * _Nullable(NSString * _Nonnull measurement, NSDictionary<NSString *,id> * _Nonnull data) {
                NSString *measurementKey = measurement;
                if ([measurement isEqualToString:FT_LOGGER_SOURCE] || [measurement isEqualToString:FT_LOGGER_TVOS_SOURCE]) {
                    measurementKey = @"log";
                }
                id returnData = [lineDataModifierDict valueForKey:measurementKey];
                if (returnData && [returnData isKindOfClass:NSDictionary.class]) {
                    return returnData;
                }
                return nil;
            };
        }
        if ([params.allKeys containsObject:@"remoteConfiguration"]) {
            config.remoteConfiguration = [params[@"remoteConfiguration"] boolValue];
        }
        if ([params.allKeys containsObject:@"remoteConfigMiniUpdateInterval"]) {
            config.remoteConfigMiniUpdateInterval = MAX(0, [params[@"remoteConfigMiniUpdateInterval"] intValue]);
        }
        if ([params.allKeys containsObject:@"enableDataFilter"]) {
            config.enableDataFilter = [params[@"enableDataFilter"] boolValue];
        }
        if ([params.allKeys containsObject:@"dataFilters"] && [[params valueForKey:@"dataFilters"] isKindOfClass:NSDictionary.class]) {
            config.dataFilters = [params valueForKey:@"dataFilters"];
        }
        [FTSDKAgent startWithConfigOptions:config];
    };
    if (NSThread.isMainThread) {
        block();
    } else {
        dispatch_sync(dispatch_get_main_queue(), block);
    }
}

UNI_EXPORT_METHOD(@selector(setDatakitURL:))
- (void)setDatakitURL:(NSDictionary *)params{
    NSString *datakitUrl = [params objectForKey:@"datakitUrl"];
    if (datakitUrl.length > 0) {
        [FTSDKAgent setDatakitURL:datakitUrl];
    }
}

UNI_EXPORT_METHOD(@selector(setDatawayURL:))
- (void)setDatawayURL:(NSDictionary *)params{
    NSString *datawayUrl = [params objectForKey:@"datawayUrl"];
    NSString *clientToken = [params objectForKey:@"clientToken"];
    if (datawayUrl.length > 0 && clientToken.length > 0) {
        [FTSDKAgent setDatawayURL:datawayUrl clientToken:clientToken];
    }
}

UNI_EXPORT_METHOD(@selector(updateRemoteConfigWithMiniUpdateInterval:callback:))
- (void)updateRemoteConfigWithMiniUpdateInterval:(NSDictionary *)params callback:(UniModuleKeepAliveCallback)callback{
    NSInteger miniUpdateInterval = MAX(0, [[params objectForKey:@"miniUpdateInterval"] integerValue]);
    [FTSDKAgent updateRemoteConfigWithMiniUpdateInterval:miniUpdateInterval completion:^FTRemoteConfigModel * _Nullable(BOOL success, NSError * _Nullable error, FTRemoteConfigModel * _Nullable model, NSDictionary<NSString *,id> * _Nullable content) {
        NSMutableDictionary *result = [@{
            @"success": @(success),
            @"platform": @"ios"
        } mutableCopy];
        if (content && [NSJSONSerialization isValidJSONObject:content]) {
            NSData *jsonData = [NSJSONSerialization dataWithJSONObject:content options:0 error:nil];
            if (jsonData) {
                NSString *rawJson = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
                if (rawJson) {
                    result[@"rawJson"] = rawJson;
                }
            }
        }
        if (error) {
            result[@"errorCode"] = @(error.code);
            result[@"errorMessage"] = error.localizedDescription ?: @"Remote configuration update failed.";
        }
        if (callback) {
            dispatch_async(dispatch_get_main_queue(), ^{
                callback(result, NO);
            });
        }
        return nil;
    }];
}
#pragma mark --------- BIND USER DATA ----------
UNI_EXPORT_METHOD(@selector(bindRUMUserData:))
UNI_EXPORT_METHOD(@selector(unbindRUMUserData))
- (void)bindRUMUserData:(NSDictionary *)params{
    NSString *userId = [params objectForKey:@"userId"];
    NSString *userName = [params objectForKey:@"userName"];
    NSString *userEmail = [params objectForKey:@"userEmail"];
    NSDictionary *extra = [params objectForKey:@"extra"];
    [[FTSDKAgent sharedInstance] bindUserWithUserID:userId userName:userName userEmail:userEmail extra:extra];
}
- (void)unbindRUMUserData{
    [[FTSDKAgent sharedInstance] unbindUser];
}
UNI_EXPORT_METHOD(@selector(appendGlobalContext:))
UNI_EXPORT_METHOD(@selector(appendRUMGlobalContext:))
UNI_EXPORT_METHOD(@selector(appendLogGlobalContext:))
- (void)appendGlobalContext:(NSDictionary*)context{
    [FTSDKAgent appendGlobalContext:context];
}
- (void)appendRUMGlobalContext:(NSDictionary*)context{
    [FTSDKAgent appendRUMGlobalContext:context];
}
- (void)appendLogGlobalContext:(NSDictionary*)context{
    [FTSDKAgent appendLogGlobalContext:context];
}
UNI_EXPORT_METHOD(@selector(flushSyncData))

- (void)flushSyncData{
    [[FTSDKAgent sharedInstance] flushSyncData];
}
UNI_EXPORT_METHOD(@selector(shutDown))
- (void)shutDown{
    [FTSDKAgent shutDown];
}
UNI_EXPORT_METHOD(@selector(clearAllData))
- (void)clearAllData{
    [FTSDKAgent clearAllData];
}
#pragma mark --------- Bridge Context ----------
UNI_EXPORT_METHOD(@selector(appendBridgeContext:))
- (void)appendBridgeContext:(NSDictionary *)context{
#if FT_UNI_PLUGIN_HAS_INNER_LOG
    FTInnerLogInfo(@"[GC-UniPlugin-App] appendBridgeContext: %@",context);
#else
        NSLog(@"[GC-UniPlugin-App] appendBridgeContext: %@",context);
#endif
    if (context && context.count > 0) {
        NSDictionary *immutableContext = [context copy];
        [FTUniPluginUtils appendBridgeContext:immutableContext];
    }
}
@end
