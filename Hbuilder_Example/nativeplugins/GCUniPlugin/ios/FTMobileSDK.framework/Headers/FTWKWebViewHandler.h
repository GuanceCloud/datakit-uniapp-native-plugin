//
//  FTWKWebViewHandler.h
//  FTMobileAgent
//
//  Created by 胡蕾蕾 on 2020/9/16.
//  Copyright © 2020 hll. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <WebKit/WebKit.h>
#import "FTMobileConfig.h"

NS_ASSUME_NONNULL_BEGIN
@protocol FTWKWebViewRumDelegate <NSObject>
@optional

-(void)ftAddScriptMessageHandlerWithWebView:(WKWebView *)webView;

@end
@interface FTWKWebViewHandler : NSObject<WKNavigationDelegate>
@property (nonatomic, assign) BOOL enableTrace;
@property (nonatomic, weak) id<FTWKWebViewRumDelegate> traceDelegate;
+ (instancetype)sharedInstance;
- (void)reloadWebView:(WKWebView *)webView completionHandler:(void (^)(NSURLRequest *request,BOOL needTrace))completionHandler;
- (void)addWebView:(WKWebView *)webView request:(NSURLRequest *)request;

- (void)removeWebView:(WKWebView *)webView;


- (void)addScriptMessageHandlerWithWebView:(WKWebView *)webView;
@end

NS_ASSUME_NONNULL_END
