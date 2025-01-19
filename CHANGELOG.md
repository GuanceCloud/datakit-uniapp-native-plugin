# 0.2.0
* 适配 iOS 1.5.9
* Android ft-sdk 1.6.7, ft-native:1.1.1, ft-plugin-legacy 1.1.8
* 支持 Open Dataway 直传
* 支持 uni 小程序与原生 App 混合开发
* `GCUniPlugin-MobileAgent`
    * 支持通过 autoSync = false , flushSyncData() 自主管理数据同步时机，默认自动同步
    * 支持通过 syncPageSize，syncSleepTime 设置数据同步页数大小和同步间歇时间
    * 支持通过 compressIntakeRequests  对同步数据进行 deflate 压缩配置
    * 支持通过 enableLimitWithDbSize = true，dbCacheLimit 开启数据同步缓存限制，
      并支持使用 dbDiscardStrategy 设置缓存超出上限后数据丢弃策略。设置之后 
      rumCacheLimitCount 和 logCacheLimitCount 设置将失效果
* `GCUniPlugin-RUM` 
    * 支持通过 enableTrackNativeCrash 开启 Native Crash 监测。
    * 支持通过 enableTrackNativeAppANR 开启 Native ANR 监测。
    * 支持通过 enableTrackNativeFreeze 开启 Native Free 监测，通过 nativeFreezeDurationMs 设置监测阈值范围
    * 支持通过 rumCacheLimitCount ，rumDiscardStrategy 限制 RUM 数据缓存条目数上限，默认 100_000
* `GCUniPlugin-Logger`
    * 支持通过 logCacheLimitCount 限制 RUM 数据缓存条目数上限，默认 5000

---
# 0.1.2
*  适配 iOS 1.4.7-alpha.1,Android 1.3.16-beta02
*  RUM API-addError 添加可选参数 state 

---
# 0.1.1
*  适配 Android 1.3.10-beta01

---
# 0.1.0
*  适配 iOS 1.3.10.beta.1, Android 1.3.9-beta02
*  提供 Action，View，Longtask，Resource，Log 对应调用接口
