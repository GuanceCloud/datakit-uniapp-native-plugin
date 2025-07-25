//
//  FTUniPluginUtils.m
//  GC-UniPlugin-App
//
//  Created by hulilei on 2025/3/18.
//

#import "FTUniPluginUtils.h"

@implementation FTUniPluginUtils
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
