//
//  FTTracerModule.m
//  GC-UniPlugin-App
//
//  Created by hulilei on 2023/2/3.
//

#import "FTTracerModule.h"
#import <FTMobileSDK/FTMobileAgent.h>
@implementation FTTracerModule
#pragma mark --------- INIT ----------
UNI_EXPORT_METHOD_SYNC(@selector(setConfig:))
- (void)setConfig:(NSDictionary *)params{
    FTTraceConfig *trace = [[FTTraceConfig alloc]init];
    if ([params.allKeys containsObject:@"samplerate"]) {
        trace.samplerate =[params[@"samplerate"] doubleValue] * 100;
    }
    if ([params.allKeys containsObject:@"traceType"]) {
        NSString *type =  params[@"traceType"];
        //`ddTrace`（default）、`zipkinMultiHeader`、`zipkinSingleHeader`、`traceparent`、`skywalking`、`jaeger`
        if([type isEqualToString:@"ddTrace"]){
            trace.networkTraceType = FTNetworkTraceTypeDDtrace;
        }else if ([type isEqualToString:@"zipkinMultiHeader"]){
            trace.networkTraceType = FTNetworkTraceTypeZipkinMultiHeader;
        }else if ([type isEqualToString:@"zipkinSingleHeader"]){
            trace.networkTraceType = FTNetworkTraceTypeZipkinSingleHeader;
        }else if ([type isEqualToString:@"traceparent"]){
            trace.networkTraceType = FTNetworkTraceTypeTraceparent;
        }else if ([type isEqualToString:@"skywalking"]){
            trace.networkTraceType = FTNetworkTraceTypeSkywalking;
        }else if ([type isEqualToString:@"jaeger"]){
            trace.networkTraceType = FTNetworkTraceTypeJaeger;
        }
    }
    if ([params.allKeys containsObject:@"enableLinkRUMData"]) {
        trace.enableLinkRumData = [params[@"enableLinkRUMData"] boolValue];
    }
    if ([params.allKeys containsObject:@"enableNativeAutoTrace"]) {
        trace.enableAutoTrace = [params[@"enableNativeAutoTrace"] boolValue];
    }
    [[FTMobileAgent sharedInstance] startTraceWithConfigOptions:trace];
}
#pragma mark --------- TRACE HEADER GET ----------
UNI_EXPORT_METHOD_SYNC(@selector(getTraceHeader:))
- (NSDictionary *)getTraceHeader:(NSDictionary *)params{
    NSString *key = [params objectForKey:@"key"];
    NSString *urlStr = [params objectForKey:@"url"];
    NSURL *url = [NSURL URLWithString:urlStr];
    if(url){
        if(key){
            NSDictionary *header = [[FTExternalDataManager sharedManager] getTraceHeaderWithKey:key url:url];
            return header;
        }else{
            return [[FTExternalDataManager sharedManager] getTraceHeaderWithUrl:url];
        }
    }
    return nil;
}
@end
