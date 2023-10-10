//
//  FTLogModule.m
//  Guance-UniPlugin-App
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
        config.enableLinkRumData = params[@"enableLinkRumData"];
    }
    if ([params.allKeys containsObject:@"enableCustomLog"]) {
        config.enableCustomLog = params[@"enableCustomLog"];
    }
    if ([params.allKeys containsObject:@"discardStrategy"]) {
        NSString *type = params[@"discardStrategy"];
        //`discard`丢弃新数据（默认）、`discardOldest`
        if([type isEqualToString:@"discardOldest"]){
            config.discardType = FTDiscardOldest;
        }else{
            config.discardType = FTDiscard;
        }
    }
    if ([params.allKeys containsObject:@"logLevelFilters"]) {
        NSArray *filters = params[@"logLevelFilters"];
        if(filters.count>0){
            NSEnumerator *enumerator = filters.objectEnumerator;
            NSString *level;
            NSMutableArray *logLevelFilters = [NSMutableArray new];
            while ((level = enumerator.nextObject)) {
                //`info`提示、`warning`警告、`error`错误、`critical`、`ok`恢复
                if([level isEqualToString:@"info"]){
                    [logLevelFilters addObject:@(FTStatusInfo)];
                }else if([level isEqualToString:@"warning"]){
                    [logLevelFilters addObject:@(FTStatusWarning)];
                }else if([level isEqualToString:@"error"]){
                    [logLevelFilters addObject:@(FTStatusError)];
                }else if([level isEqualToString:@"critical"]){
                    [logLevelFilters addObject:@(FTStatusCritical)];
                }else if([level isEqualToString:@"ok"]){
                    [logLevelFilters addObject:@(FTStatusOk)];
                }
            }
            config.logLevelFilter =  logLevelFilters;
        }
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
        FTLogStatus status;
        if([statusStr isEqualToString:@"info"]){
            status = FTStatusInfo;
        }else if([statusStr isEqualToString:@"warning"]){
            status = FTStatusWarning;
        }else if([statusStr isEqualToString:@"error"]){
            status = FTStatusError;
        }else if([statusStr isEqualToString:@"critical"]){
            status = FTStatusCritical;
        }else {
            status = FTStatusOk;
        }
        [[FTMobileAgent sharedInstance] logging:content status:status property:property];
    }
}
@end
