//
//  ViewController.m
//  HelloUniMPDemo
//
//  Created by XHY on 2019/12/28.
//  Copyright © 2019 DCloud. All rights reserved.
//

#import "ViewController.h"
#import "DCUniMP.h"

#define k_GCUniMPAppId @"__UNI__EDA429D"

@interface ViewController () <DCUniMPSDKEngineDelegate>

@property (nonatomic, weak) DCUniMPInstance *uniMPInstance; /**< 保存当前打开的小程序应用的引用 注意：请使用 weak 修辞，否则应在关闭小程序时置为 nil */

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.

    [self checkUniMPResource:k_GCUniMPAppId];
    [self setUniMPMenuItems];
}


/// 检查运行目录是否存在应用资源，不存在将应用资源部署到运行目录
- (void)checkUniMPResource:(NSString *)appid {
#warning 注意：isExistsUniMP: 方法判断的仅是运行路径中是否有对应的应用资源，宿主还需要做好内置wgt版本的管理，如果更新了内置的wgt也应该执行 releaseAppResourceToRunPathWithAppid 方法应用最新的资源
    if (![DCUniMPSDKEngine isExistsUniMP:appid]) {
        // 读取导入到工程中的wgt应用资源
        NSString *appResourcePath = [[NSBundle mainBundle] pathForResource:appid ofType:@"wgt"];
        if (!appResourcePath) {
            NSLog(@"资源路径不正确，请检查");
            return;
        }
        // 将应用资源部署到运行路径中
        NSError *error;
        if ([DCUniMPSDKEngine installUniMPResourceWithAppid:appid resourceFilePath:appResourcePath password:nil error:&error]) {
            NSLog(@"小程序 %@ 应用资源文件部署成功，版本信息：%@",appid,[DCUniMPSDKEngine getUniMPVersionInfoWithAppid:appid]);
        } else {
            NSLog(@"小程序 %@ 应用资源部署失败： %@",appid,error);
        }
    } else {
        NSLog(@"已存在小程序 %@ 应用资源，版本信息：%@",appid,[DCUniMPSDKEngine getUniMPVersionInfoWithAppid:appid]);
    }
}

/// 配置胶囊按钮菜单 ActionSheet 全局项（点击胶囊按钮 ··· ActionSheet弹窗中的项）
- (void)setUniMPMenuItems {

    DCUniMPMenuActionSheetItem *item1 = [[DCUniMPMenuActionSheetItem alloc] initWithTitle:@"将小程序隐藏到后台" identifier:@"enterBackground"];
    DCUniMPMenuActionSheetItem *item2 = [[DCUniMPMenuActionSheetItem alloc] initWithTitle:@"关闭小程序" identifier:@"closeUniMP"];

//     运行内置的 __UNI__CBDCE04 小程序，点击进去 小程序-原生通讯 页面，打开下面的注释，并将 item3 添加到 MenuItems 中，可以测试原生向小程序发送事件
//    DCUniMPMenuActionSheetItem *item3 = [[DCUniMPMenuActionSheetItem alloc] initWithTitle:@"SendUniMPEvent" identifier:@"SendUniMPEvent"];
    // 添加到全局配置
    [DCUniMPSDKEngine setDefaultMenuItems:@[item1,item2]];

    // 设置 delegate
    [DCUniMPSDKEngine setDelegate:self];
}

/// 启动小程序
- (IBAction)openUniMP:(id)sender {

    // 获取配置信息
    DCUniMPConfiguration *configuration = [[DCUniMPConfiguration alloc] init];

    // 配置启动小程序时传递的数据（目标小程序可在 App.onLaunch，App.onShow 中获取到启动时传递的数据）
    configuration.extraData = @{ @"launchInfo":@"Hello UniMP" };

    // 配置小程序启动后直接打开的页面路径 例：@"pages/component/view/view?action=redirect&password=123456"
//    configuration.path = @"pages/component/view/view?action=redirect&password=123456";

    // 开启后台运行
    configuration.enableBackground = YES;

    // 设置打开方式
    configuration.openMode = DCUniMPOpenModePush;

    // 启用侧滑手势关闭小程序
    configuration.enableGestureClose = YES;

    __weak __typeof(self)weakSelf = self;
    // 打开小程序
    [DCUniMPSDKEngine openUniMP:k_GCUniMPAppId configuration:configuration completed:^(DCUniMPInstance * _Nullable uniMPInstance, NSError * _Nullable error) {
        if (uniMPInstance) {
            weakSelf.uniMPInstance = uniMPInstance;
        } else {
            NSLog(@"打开小程序出错：%@",error);
        }
    }];
}

/// 预加载后打开小程序
- (IBAction)preloadUniMP:(id)sender {

    // 获取配置信息
    DCUniMPConfiguration *configuration = [[DCUniMPConfiguration alloc] init];

    // 开启后台运行
    configuration.enableBackground = YES;

    // 设置打开方式
    configuration.openMode = DCUniMPOpenModePresent;

    // 启用侧滑手势关闭小程序
    configuration.enableGestureClose = YES;


    __weak __typeof(self)weakSelf = self;
    // 预加载小程序
    [DCUniMPSDKEngine preloadUniMP:k_GCUniMPAppId configuration:configuration completed:^(DCUniMPInstance * _Nullable uniMPInstance, NSError * _Nullable error) {
        if (uniMPInstance) {
            weakSelf.uniMPInstance = uniMPInstance;
            // 预加载后打开小程序
            [uniMPInstance showWithCompletion:^(BOOL success, NSError * _Nullable error) {
                if (error) {
                    NSLog(@"show 小程序失败：%@",error);
                }
            }];
        } else {
            NSLog(@"预加载小程序出错：%@",error);
        }
    }];
}

#pragma mark - DCUniMPSDKEngineDelegate
/// 胶囊按钮‘x’关闭按钮点击回调
- (void)closeButtonClicked:(NSString *)appid {
    NSLog(@"点击了 小程序 %@ 的关闭按钮",appid);
}

/// DCUniMPMenuActionSheetItem 点击触发回调方法
- (void)defaultMenuItemClicked:(NSString *)appid identifier:(NSString *)identifier {
    NSLog(@"标识为 %@ 的 item 被点击了", identifier);

    // 将小程序隐藏到后台
    if ([identifier isEqualToString:@"enterBackground"]) {
        __weak __typeof(self)weakSelf = self;
        [self.uniMPInstance hideWithCompletion:^(BOOL success, NSError * _Nullable error) {
            if (success) {
                NSLog(@"小程序 %@ 进入后台",weakSelf.uniMPInstance.appid);
            } else {
                NSLog(@"hide 小程序出错：%@",error);
            }
        }];
    }
    // 关闭小程序
    else if ([identifier isEqualToString:@"closeUniMP"]) {
        [self.uniMPInstance closeWithCompletion:^(BOOL success, NSError * _Nullable error) {
            if (success) {
                NSLog(@"小程序 closed");
            } else {
                NSLog(@"close 小程序出错：%@",error);
            }
        }];
    }
    // 向小程序发送消息
    else if ([identifier isEqualToString:@"SendUniMPEvent"]) {
        [self.uniMPInstance sendUniMPEvent:@"NativeEvent" data:@{@"msg":@"native message"}];
    }
}

/// 返回打开小程序时的自定义闪屏视图
- (UIView *)splashViewForApp:(NSString *)appid {
    UIView *splashView = [[[NSBundle mainBundle] loadNibNamed:@"SplashView" owner:self options:nil] lastObject];
    return splashView;
}

/// 小程序关闭回调方法
- (void)uniMPOnClose:(NSString *)appid {
    NSLog(@"小程序 %@ 被关闭了",appid);

    self.uniMPInstance = nil;

    // 可以在这个时机再次打开小程序
//    [self openUniMP:nil];
}


/// 小程序向原生发送事件回调方法
/// @param appid 对应小程序的appid
/// @param event 事件名称
/// @param data 数据：NSString 或 NSDictionary 类型
/// @param callback 回调数据给小程序
- (void)onUniMPEventReceive:(NSString *)appid event:(NSString *)event data:(id)data callback:(DCUniMPKeepAliveCallback)callback {
    NSLog(@"Receive UniMP:%@ event:%@ data:%@",appid,event,data);

    // 回传数据给小程序
    // DCUniMPKeepAliveCallback 用法请查看定义说明
    if (callback) {
        callback(@"native callback message",NO);
    }
}

@end
