//
//  FTMobileUniModule.m
//  Guance-UniPlugin-App
//
//  Created by hulilei on 2023/2/3.
//

#import "FTMobileUniModule.h"
#import <FTMobileSDK/FTMobileAgent.h>
@implementation FTMobileUniModule
#pragma mark --------- SDK INIT ----------
UNI_EXPORT_METHOD_SYNC(@selector(sdkConfig:))
- (void)sdkConfig:(NSDictionary *)params{
    dispatch_block_t block = ^(){
        NSString *serverUrl = [params valueForKey:@"serverUrl"];
        FTMobileConfig *config = [[FTMobileConfig alloc]initWithMetricsUrl:serverUrl];
        if([params.allKeys containsObject:@"debug"]){
            config.enableSDKDebugLog = params[@"debug"];
        }
        if([params.allKeys containsObject:@"envType"]){
            id env = params[@"envType"];
            if([env isKindOfClass:NSString.class]){
                config.env = env;
            }
        }
        if ([params.allKeys containsObject:@"globalContext"]) {
            config.globalContext = params[@"globalContext"];
        }
        if ([params.allKeys containsObject:@"service"]) {
            config.service = params[@"service"];
        }
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
@end
