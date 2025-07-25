//
//  FTLogModule.m
//  GC-UniPlugin-App
//
//  Created by hulilei on 2023/2/3.
//

#import "FTLogModule.h"
#import <FTMobileSDK/FTMobileAgent.h>
@implementation FTLogModule
#pragma mark --------- INIT ----------
UNI_EXPORT_METHOD_SYNC(@selector(setConfig:))
- (void)setConfig:(NSDictionary *)params{
    FTLoggerConfig *config = [[FTLoggerConfig alloc]init];
    if ([params.allKeys containsObject:@"samplerate"]) {
        config.samplerate =[params[@"samplerate"] doubleValue] * 100;
    }
    if ([params.allKeys containsObject:@"enableLinkRumData"]) {
        config.enableLinkRumData = [params[@"enableLinkRumData"] boolValue];
    }
    if ([params.allKeys containsObject:@"enableCustomLog"]) {
        config.enableCustomLog = [params[@"enableCustomLog"] boolValue];
    }
    if ([params.allKeys containsObject:@"discardStrategy"]) {
        NSString *type = params[@"discardStrategy"];
        // `discard` discards new data (default), `discardOldest` discards the oldest data
        if([type isEqualToString:@"discardOldest"]){
            config.discardType = FTDiscardOldest;
        }else{
            config.discardType = FTDiscard;
        }
    }
    if ([params.allKeys containsObject:@"logLevelFilters"]) {
        NSArray *filters = params[@"logLevelFilters"];
        if(filters.count>0){
            config.logLevelFilter = filters;
        }
    }
    if ([params.allKeys containsObject:@"logCacheLimitCount"]) {
        config.logCacheLimitCount = [params[@"logCacheLimitCount"] intValue];
    }
    if([params.allKeys containsObject:@"globalContext"]){
        config.globalContext = [params objectForKey:@"globalContext"];
    }
    [[FTMobileAgent sharedInstance] startLoggerWithConfigOptions:config];
}
#pragma mark --------- logging ----------
UNI_EXPORT_METHOD(@selector(logging:))
- (void)logging:(NSDictionary *)params{
    NSString *content = [params objectForKey:@"content"];
    NSString *statusStr = [params objectForKey:@"status"];
    NSDictionary *property = [params objectForKey:@"property"];
    if(content && statusStr){
        [[FTLogger sharedInstance] log:content status:statusStr property:property];
    }
}
@end
