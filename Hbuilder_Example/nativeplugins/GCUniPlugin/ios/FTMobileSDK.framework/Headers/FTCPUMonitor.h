//
//  FTCPUMonitor.h
//  FTMobileAgent
//
//  Created by hulilei on 2022/7/1.
//  Copyright © 2022 DataFlux-cn. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface FTCPUMonitor : NSObject
- (double)readCpuUsage;
@end

NS_ASSUME_NONNULL_END
