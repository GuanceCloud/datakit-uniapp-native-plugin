//
//  UIGestureRecognizer+FTAutoTrack.h
//  FTMobileAgent
//
//  Created by 胡蕾蕾 on 2021/7/21.
//  Copyright © 2021 hll. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UITapGestureRecognizer (FTAutoTrack)
-(instancetype)dataflux_initWithTarget:(id)target action:(SEL)action;
- (void)dataflux_addTarget:(id)target action:(SEL)action;
@end

@interface UILongPressGestureRecognizer (FTAutoTrack)
-(instancetype)dataflux_initWithTarget:(id)target action:(SEL)action;
- (void)dataflux_addTarget:(id)target action:(SEL)action;
@end

NS_ASSUME_NONNULL_END
