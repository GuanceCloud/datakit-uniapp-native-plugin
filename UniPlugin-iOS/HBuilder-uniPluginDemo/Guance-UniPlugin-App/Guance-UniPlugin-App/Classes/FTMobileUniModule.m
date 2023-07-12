//
//  FTMobileUniModule.m
//  Guance-UniPlugin-App
//
//  Created by hulilei on 2023/2/3.
//

#import "FTMobileUniModule.h"
#import <FTMobileSDK/FTMobileAgent.h>
#import <FTMobileSDK/FTThreadDispatchManager.h>
@implementation FTMobileUniModule
#pragma mark --------- SDK INIT ----------
UNI_EXPORT_METHOD_SYNC(@selector(sdkConfig:))
- (void)sdkConfig:(NSDictionary *)params{
    [FTThreadDispatchManager performBlockDispatchMainSyncSafe:^{
        NSString *serverUrl = [params valueForKey:@"serverUrl"];
        FTMobileConfig *config = [[FTMobileConfig alloc]initWithMetricsUrl:serverUrl];
        if([params.allKeys containsObject:@"debug"]){
            config.enableSDKDebugLog = params[@"debug"];
        }
        
        if([params.allKeys containsObject:@"envType"]){
            NSString *envType = params[@"envType"];
            //`prod`线上（默认）、`gray`灰度、`pre`预发、`common`日常、`local`本地
            if([envType isEqualToString:@"prod"]){
                config.env = FTEnvProd;
            }else if([envType isEqualToString:@"gray"]){
                config.env = FTEnvGray;
            }else if([envType isEqualToString:@"pre"]){
                config.env = FTEnvPre;
            }else if([envType isEqualToString:@"common"]){
                config.env = FTEnvCommon;
            }else if([envType isEqualToString:@"local"]){
                config.env = FTEnvLocal;
            }
        }
        if ([params.allKeys containsObject:@"globalContext"]) {
            config.globalContext = params[@"globalContext"];
        }
        if ([params.allKeys containsObject:@"service"]) {
            config.service = params[@"service"];
        }
        [FTMobileAgent startWithConfigOptions:config];
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
    [[FTMobileAgent sharedInstance] bindUserWithUserID:userId userName:userName userEmail:userEmail extra:extra];
}
- (void)unbindRUMUserData{
    [[FTMobileAgent sharedInstance] logout];
}
@end
