//
//  FTAppLaunchTracker.h
//  FTMobileAgent
//
//  Created by hulilei on 2022/2/14.
//  Copyright © 2022 DataFlux-cn. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN
@protocol FTAppLaunchDataDelegate <NSObject>

-(void)ftAppHotStart:(NSNumber *)duration;

-(void)ftAppColdStart:(NSNumber *)duration isPreWarming:(BOOL)isPreWarming;
@end
@interface FTAppLaunchTracker : NSObject
@property (nonatomic,weak) id<FTAppLaunchDataDelegate> delegate;
- (instancetype)initWithDelegate:(nullable id)delegate;
@end

NS_ASSUME_NONNULL_END
