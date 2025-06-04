//
//  FTUniPluginUtils.m
//  Guance-UniPlugin-App
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
        // 正则表达式：允许任意子域名，主域名为 dcloud.net.cn
        NSString *pattern =
        @"^https?://"                // 协议头（http 或 https）
        @"([a-zA-Z0-9-]+\\.)?"       // 任意子域名（例如 s2、t1、bs1 或其他）
        @"dcloud\\.net\\.cn"          // 固定主域名
        @"(:\\d+)?"                  // 可选端口（例如 :8080）
        @"/.*";                      // 任意路径
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
