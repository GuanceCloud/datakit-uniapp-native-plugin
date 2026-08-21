#import "GCUniPluginUTSConfig.h"
#import <DCloudUTSFoundation/DCloudUTSFoundation.h>

@implementation GCUniPluginUTSConfig

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        NSBundle *bundle = [NSBundle bundleForClass:self];
        NSString *path = [bundle pathForResource:@"config.json" ofType:nil];
        if (path == nil) {
            return;
        }

        NSData *data = [NSData dataWithContentsOfFile:path];
        NSDictionary *config = data == nil ? nil : [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
        if (![config isKindOfClass:NSDictionary.class]) {
            return;
        }

        NSArray *components = config[@"components"];
        for (NSDictionary *item in components) {
            if (![item isKindOfClass:NSDictionary.class]) {
                continue;
            }

            NSString *delegateClass = [WXConvert NSString:item[@"delegateClass"]];
            Class delegate = NSClassFromString(delegateClass);
            if (delegate != nil && [delegate respondsToSelector:@selector(registerComponent)]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
                [delegate performSelector:@selector(registerComponent)];
#pragma clang diagnostic pop
            }

            NSString *className = [WXConvert NSString:item[@"class"]];
            NSString *name = [WXConvert NSString:item[@"name"]];
            Class componentClass = NSClassFromString(className);
            if (name != nil && componentClass != nil) {
                [WXSDKEngine registerComponent:name withClass:componentClass];
            }
        }
    });
}

@end
