//
//  UIScrollView+FTAutoTrack.h
//  FTMobileAgent
//
//  Created by 胡蕾蕾 on 2021/7/28.
//  Copyright © 2021 DataFlux-cn. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UITableView (FTAutoTrack)

- (void)dataflux_setDelegate:(id <UITableViewDelegate>)delegate;

@end

@interface UICollectionView (FTAutoTrack)

- (void)dataflux_setDelegate:(id <UICollectionViewDelegate>)delegate;

@end

NS_ASSUME_NONNULL_END
