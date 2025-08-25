//
//  FTUniPluginUtils.m
//  GC-UniPlugin-App
//
//  Created by hulilei on 2025/3/18.
//

#import "FTUniPluginUtils.h"
static NSDictionary *bridgeContext;
static dispatch_queue_t bridgeContextQueue;
@implementation FTUniPluginUtils
+ (void)initialize {
    if (self == [FTUniPluginUtils class]) {
        bridgeContextQueue = dispatch_queue_create("com.ft.sdk.bridgeContextQueue", DISPATCH_QUEUE_SERIAL);
        bridgeContext = @{};
    }
}
+ (void)setBridgeContext:(NSDictionary *)context{
    dispatch_sync(bridgeContextQueue, ^{
        bridgeContext = context;
    });
}
+ (NSDictionary *)mergeBridgeContext:(NSDictionary *)property{
    __block NSDictionary *bridge;
    dispatch_sync(bridgeContextQueue, ^{
        bridge = [bridgeContext copy];
    });
    NSMutableDictionary *result = [NSMutableDictionary dictionary];
    if (property) [result addEntriesFromDictionary:property];
    if (bridge) [result addEntriesFromDictionary:bridge];
    return [result copy];
}

+ (NSDictionary *)safeBridgeContext{
    __block NSDictionary *result;
    dispatch_sync(bridgeContextQueue, ^{
        result = bridgeContext;
    });
    return result;
}
+ (BOOL)filterBlackResource:(NSURL *)url{
    static NSRegularExpression *regex;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        NSError *error = nil;
        // Regular expression: allow any subdomain, the main domain is dcloud.net.cn
        NSString *pattern =
        @"^https?://"                // Protocol header (http or https)
        @"([a-zA-Z0-9-]+\\.)?"       // Any subdomain (such as s2, t1, bs1, etc.)
        @"dcloud\\.net\\.cn"          // Fixed main domain
        @"(:\\d+)?"                  // Optional port (e.g., :8080)
        @"/.*";                      // Any path
        regex =
        [NSRegularExpression regularExpressionWithPattern:pattern
                                                  options:0
                                                    error:&error];
    });
    NSTextCheckingResult *firstMatch =[regex firstMatchInString:url.absoluteString options:0 range:NSMakeRange(0, [url.absoluteString length])];
    if (firstMatch) {
        return YES;
    }
    return NO;
}
@end
