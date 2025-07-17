//
//  FTMobileUniModule.m
//  GC-UniPlugin-App
//
//  Created by hulilei on 2023/2/3.
//

#import "FTMobileUniModule.h"
#import "GC-UniPlugin-App-Version.h"
#import <FTMobileSDK/FTMobileAgent.h>
#import <FTMobileSDK/FTMobileConfig+Private.h>
#import <FTMobileSDK/FTConstants.h>
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
        FTMobileConfig *config;
        if(dataWayUrl && dataWayUrl.length>0 && clientToken && clientToken.length>0){
            config = [[FTMobileConfig alloc]initWithDatawayUrl:dataWayUrl clientToken:clientToken];
        }else if(datakitUrl && datakitUrl.length>0){
            config = [[FTMobileConfig alloc]initWithDatakitUrl:datakitUrl];
        }else{
            return;
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
        [config addPkgInfo:@"uniapp" value:UniPluginAppVersion];
        [FTMobileAgent startWithConfigOptions:config];
    };
    if (NSThread.isMainThread) {
        block();
    } else {
        dispatch_sync(dispatch_get_main_queue(), block);
    }
}
#pragma mark --------- BIND USER DATA ----------
UNI_EXPORT_METHOD(@selector(bindRUMUserData:))
UNI_EXPORT_METHOD(@selector(unbindRUMUserData))
- (void)bindRUMUserData:(NSDictionary *)params{
    NSString *userId = [params objectForKey:@"userId"];
    NSString *userName = [params objectForKey:@"userName"];
    NSString *userEmail = [params objectForKey:@"userEmail"];
    NSDictionary *extra = [params objectForKey:@"extra"];
    [[FTMobileAgent sharedInstance] bindUserWithUserID:userId userName:userName userEmail:userEmail extra:extra];
}
- (void)unbindRUMUserData{
    [[FTMobileAgent sharedInstance] unbindUser];
}
UNI_EXPORT_METHOD(@selector(appendGlobalContext:))
UNI_EXPORT_METHOD(@selector(appendRUMGlobalContext:))
UNI_EXPORT_METHOD(@selector(appendLogGlobalContext:))
- (void)appendGlobalContext:(NSDictionary*)context{
    [FTMobileAgent appendGlobalContext:context];
}
- (void)appendRUMGlobalContext:(NSDictionary*)context{
    [FTMobileAgent appendRUMGlobalContext:context];
}
- (void)appendLogGlobalContext:(NSDictionary*)context{
    [FTMobileAgent appendLogGlobalContext:context];
}
UNI_EXPORT_METHOD(@selector(flushSyncData))

- (void)flushSyncData{
    [[FTMobileAgent sharedInstance] flushSyncData];
}
UNI_EXPORT_METHOD(@selector(shutDown))
- (void)shutDown{
    [FTMobileAgent shutDown];
}
UNI_EXPORT_METHOD(@selector(clearAllData))
- (void)clearAllData{
    [FTMobileAgent clearAllData];
}
@end
