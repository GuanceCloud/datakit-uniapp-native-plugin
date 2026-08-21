#import "GCUniSessionReplayUTSConfig.h"
#import <DCloudUTSFoundation/DCloudUTSFoundation.h>

@implementation GCUniSessionReplayUTSConfig

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

        NSString *hookClass = config[@"hooksClass"];
        if ([hookClass isKindOfClass:NSString.class]) {
            [DCUniBridge registerHookClass:hookClass];
        }
    });
}

@end
