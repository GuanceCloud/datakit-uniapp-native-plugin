//
//  FTRUMModule.m
//  GC-UniPlugin-App
//
//  Created by hulilei on 2023/2/3.
//

#import "FTRUMModule.h"
#import <FTMobileSDK/FTMobileAgent.h>
#import "FTUniPluginUtils.h"

@implementation FTRUMModule
#pragma mark --------- INIT ----------
UNI_EXPORT_METHOD_SYNC(@selector(setConfig:))
- (void)setConfig:(NSDictionary *)params{
    NSString *rumAppId = [params objectForKey:@"iOSAppId"];
    FTRumConfig *rumConfig = [[FTRumConfig alloc]initWithAppid:rumAppId];
    if ([params.allKeys containsObject:@"samplerate"]) {
        rumConfig.samplerate = [params[@"samplerate"] doubleValue] * 100;
    }
    if ([params.allKeys containsObject:@"sessionOnErrorSampleRate"]) {
        rumConfig.sessionOnErrorSampleRate = [params[@"sessionOnErrorSampleRate"] doubleValue] * 100;
    }
    if ([params.allKeys containsObject:@"enableNativeUserAction"]) {
        rumConfig.enableTraceUserAction = [params[@"enableNativeUserAction"] boolValue];
    }
    if ([params.allKeys containsObject:@"enableNativeUserView"]) {
        rumConfig.enableTraceUserView = [params[@"enableNativeUserView"] boolValue];
    }
    if ([params.allKeys containsObject:@"enableNativeUserResource"]) {
        rumConfig.enableTraceUserResource = [params[@"enableNativeUserResource"] boolValue];
    }
    if ([params.allKeys containsObject:@"errorMonitorType"]) {
        id type = params[@"errorMonitorType"];
        if([type isKindOfClass:NSString.class]){
            //all, battery, memory, cpu
            if([type isEqualToString:@"all"]){
                rumConfig.errorMonitorType = FTErrorMonitorAll;
            }else if ([type isEqualToString:@"memory"]){
                rumConfig.errorMonitorType = FTErrorMonitorMemory;
            }else if ([type isEqualToString:@"cpu"]){
                rumConfig.errorMonitorType = FTErrorMonitorCpu;
            }else if ([type isEqualToString:@"battery"]){
                rumConfig.errorMonitorType = FTErrorMonitorBattery;
            }
        }else if ([type isKindOfClass:NSArray.class]){
            NSArray *typeAry = type;
            NSEnumerator *enumerator =typeAry.objectEnumerator;
            NSString *typeStr;
            while ((typeStr = enumerator.nextObject) != nil) {
                if([typeStr isEqualToString:@"all"]){
                    rumConfig.errorMonitorType = FTErrorMonitorAll;
                    break;
                }else if ([typeStr isEqualToString:@"memory"]){
                    rumConfig.errorMonitorType = rumConfig.errorMonitorType|FTErrorMonitorMemory;
                }else if ([typeStr isEqualToString:@"cpu"]){
                    rumConfig.errorMonitorType = rumConfig.errorMonitorType|FTErrorMonitorCpu;
                }else if ([typeStr isEqualToString:@"battery"]){
                    rumConfig.errorMonitorType = rumConfig.errorMonitorType|FTErrorMonitorBattery;
                }
            }
        }
    }
    if ([params.allKeys containsObject:@"deviceMonitorType"]){
        id type = params[@"deviceMonitorType"];
        //all, memory, cpu, fps
        if ([type isKindOfClass:NSString.class]){
            if([type isEqualToString:@"all"]){
                rumConfig.deviceMetricsMonitorType = FTDeviceMetricsMonitorAll;
            }else if ([type isEqualToString:@"memory"]){
                rumConfig.deviceMetricsMonitorType = FTDeviceMetricsMonitorMemory;
            }else if ([type isEqualToString:@"cpu"]){
                rumConfig.deviceMetricsMonitorType = FTDeviceMetricsMonitorCpu;
            }else if ([type isEqualToString:@"fps"]){
                rumConfig.deviceMetricsMonitorType = FTDeviceMetricsMonitorFps;
            }
        }else if([type isKindOfClass:NSArray.class]){
            NSArray *typeAry = type;
            NSEnumerator *enumerator = typeAry.objectEnumerator;
            NSString *typeStr;
            while ((typeStr = enumerator.nextObject)!=nil) {
                if([typeStr isEqualToString:@"all"]){
                    rumConfig.deviceMetricsMonitorType = FTDeviceMetricsMonitorAll;
                    break;
                }else if ([typeStr isEqualToString:@"memory"]){
                    rumConfig.deviceMetricsMonitorType = rumConfig.deviceMetricsMonitorType|FTDeviceMetricsMonitorMemory;
                }else if ([typeStr isEqualToString:@"cpu"]){
                    rumConfig.deviceMetricsMonitorType = rumConfig.deviceMetricsMonitorType|FTDeviceMetricsMonitorCpu;
                }else if ([typeStr isEqualToString:@"fps"]){
                    rumConfig.deviceMetricsMonitorType = rumConfig.deviceMetricsMonitorType|FTDeviceMetricsMonitorFps;
                }
            }
        }
    }
    if([params.allKeys containsObject:@"detectFrequency"]){
        //normal, frequent, rare
        NSString *type = params[@"detectFrequency"];
        if([type isEqualToString:@"normal"]){
            rumConfig.monitorFrequency = FTMonitorFrequencyDefault;
        }else if ([type isEqualToString:@"frequent"]){
            rumConfig.monitorFrequency = FTMonitorFrequencyFrequent;
        }else if ([type isEqualToString:@"rare"]){
            rumConfig.monitorFrequency = FTMonitorFrequencyRare;
        }
    }
    if ([params.allKeys containsObject:@"enableResourceHostIP"]) {
        rumConfig.enableResourceHostIP = [params[@"enableResourceHostIP"] boolValue];
    }
    if ([params.allKeys containsObject:@"enableTrackNativeCrash"]){
      rumConfig.enableTrackAppCrash = [params[@"enableTrackNativeCrash"] boolValue];
    }
    if ([params.allKeys containsObject:@"enableTrackNativeFreeze"]){
      rumConfig.enableTrackAppFreeze = [params[@"enableTrackNativeFreeze"] boolValue];
    }
    if ([params.allKeys containsObject:@"enableTrackNativeAppANR"]){
        rumConfig.enableTrackAppANR = [params[@"enableTrackNativeAppANR"] boolValue];
    }
    if ([params.allKeys containsObject:@"nativeFreezeDurationMs"]){
        rumConfig.freezeDurationMs = [params[@"nativeFreezeDurationMs"] doubleValue];
    }
    if ([params.allKeys containsObject:@"rumDiscardStrategy"]) {
        NSString *type = params[@"rumDiscardStrategy"];
        if([type isEqualToString:@"discard"]){
            rumConfig.rumDiscardType = FTRUMDiscard;
        }else if ([type isEqualToString:@"discardOldest"]){
            rumConfig.rumDiscardType = FTRUMDiscardOldest;
        }
    }
    if ([params.allKeys containsObject:@"rumCacheLimitCount"]) {
        rumConfig.rumCacheLimitCount = [params[@"rumCacheLimitCount"] intValue];
    }
    if ([params.allKeys containsObject:@"globalContext"]) {
        rumConfig.globalContext = params[@"globalContext"];
    }
    if (rumConfig.enableTraceUserResource) {
        rumConfig.resourceUrlHandler = ^BOOL(NSURL * _Nonnull url) {
          return [FTUniPluginUtils filterBlackResource:url];
        };
    }
    [[FTMobileAgent sharedInstance] startRumWithConfigOptions:rumConfig];
}
#pragma mark --------- RUM DATA ADD ----------
UNI_EXPORT_METHOD(@selector(startAction:))
UNI_EXPORT_METHOD(@selector(addAction:))
UNI_EXPORT_METHOD(@selector(onCreateView:))
UNI_EXPORT_METHOD(@selector(startView:))
UNI_EXPORT_METHOD(@selector(stopView:))
UNI_EXPORT_METHOD(@selector(addError:))
UNI_EXPORT_METHOD(@selector(startResource:))
UNI_EXPORT_METHOD(@selector(stopResource:))
UNI_EXPORT_METHOD(@selector(addResource:))
- (void)startAction:(NSDictionary *)params{
    NSString *actionName = [params objectForKey:@"actionName"];
    NSString *actionType = [params objectForKey:@"actionType"];
    NSDictionary *property = [params objectForKey:@"property"];
    [[FTExternalDataManager sharedManager] startAction:actionName actionType:actionType property:property];
}
- (void)addAction:(NSDictionary *)params{
    NSString *actionName = [params objectForKey:@"actionName"];
    NSString *actionType = [params objectForKey:@"actionType"];
    NSDictionary *property = [params objectForKey:@"property"];
    [[FTExternalDataManager sharedManager] addAction:actionName actionType:actionType property:property];
}
- (void)onCreateView:(NSDictionary *)params{
    NSString *viewName = [params objectForKey:@"viewName"];
    NSNumber *loadTime = [params objectForKey:@"loadTime"];
    [[FTExternalDataManager sharedManager] onCreateView:viewName loadTime:loadTime];
}
- (void)startView:(NSDictionary *)params{
    NSString *viewName = [params objectForKey:@"viewName"];
    NSDictionary *property = [params objectForKey:@"property"];
    [[FTExternalDataManager sharedManager] startViewWithName:viewName property:property];
}
- (void)stopView:(NSDictionary *)params{
    NSDictionary *property = [params objectForKey:@"property"];
    [[FTExternalDataManager sharedManager] stopViewWithProperty:property];
}
- (void)addError:(NSDictionary *)params{
    NSString *message = [params objectForKey:@"message"];
    NSString *stack = [params objectForKey:@"stack"];
    NSString *state = [params objectForKey:@"state"];
    NSString *type = [params objectForKey:@"type"];
    FTAppState appState = FTAppStateUnknown;
    if(state && [state isKindOfClass:NSString.class] && state.length>0){
        state = [state lowercaseString];
        if([state isEqualToString:@"run"]){
            appState = FTAppStateRun;
        }else if ([state isEqualToString:@"startup"]){
            appState = FTAppStateStartUp;
        }
    }
    type = type?:@"uniapp_crash";
    NSDictionary *property = [params objectForKey:@"property"];
    [[FTExternalDataManager sharedManager] addErrorWithType:type state:appState message:message stack:stack property:property];
}
- (void)startResource:(NSDictionary *)params{
    NSString *key = [params objectForKey:@"key"];
    NSDictionary *property = [params objectForKey:@"property"];
    [[FTExternalDataManager sharedManager] startResourceWithKey:key property:property];
}
- (void)stopResource:(NSDictionary *)params{
    NSString *key = [params objectForKey:@"key"];
    NSDictionary *property = [params objectForKey:@"property"];
    [[FTExternalDataManager sharedManager] stopResourceWithKey:key property:property];
}
- (void)addResource:(NSDictionary *)params{
    NSString *key = [params objectForKey:@"key"];
    NSDictionary *content = [params objectForKey:@"content"];
    if (key.length==0 || content.allKeys.count == 0) {
        return;
    }
    FTResourceContentModel *contentModel = [[FTResourceContentModel alloc]init];
    contentModel.url = [NSURL URLWithString:content[@"url"]];
    contentModel.httpMethod = content[@"httpMethod"];
    contentModel.requestHeader = content[@"requestHeader"];
    contentModel.responseHeader = content[@"responseHeader"];
    contentModel.responseBody = content[@"responseBody"];
    contentModel.httpStatusCode = [content[@"resourceStatus"] intValue];
    [[FTExternalDataManager sharedManager] addResourceWithKey:key metrics:nil content:contentModel];
}
@end
