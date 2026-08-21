//
//  FTUniPluginUtils.h
//  GC-UniPlugin-App
//
//  Created by hulilei on 2025/3/18.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface FTUniPluginUtils : NSObject
+ (BOOL)filterBlackResource:(NSURL *)url;

+ (nullable id)firstValueInDictionary:(NSDictionary *)dictionary
                           primaryKey:(NSString *)primaryKey
                          fallbackKey:(NSString *)fallbackKey;

+ (void)appendBridgeContext:(NSDictionary *)context;
+ (NSDictionary *)mergeBridgeContext:(NSDictionary *)property;
@end

NS_ASSUME_NONNULL_END
