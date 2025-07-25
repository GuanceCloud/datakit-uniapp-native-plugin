# 0.2.3
* Fixed the issue where assigning `false` to the following parameters failed on iOS:
  RUM parameters (`enableNativeUserAction`, `enableNativeUserView`, `enableNativeUserResource`),
  Log parameters (`enableLinkRumData`, `enableCustomLog`),
  and Trace parameter (`enableAutoTrace`).
---
# 0.2.2
* `GCUniPlugin-MobileAgent`
  * Support data write replacement through dataModifier, lineDataModifier, supporting data desensitization
* `GCUniPlugin-RUM` 
  * Support error sampling through sessionOnErrorSampleRate, when not sampled by samplerate, can sample RUM data from 1 minute ago when errors occur
* When RUM Resource auto-collection is enabled on iOS, added filtering method to filter dcloud internal requests, reducing redundant data
* Compatible with iOS 1.5.15, 1.5.16, Android ft-sdk 1.6.10, 1.6.11
---
# 0.2.1
* Android fixed incorrect startup time rules when offlinePackage is false
* Android fixed crash issue when enabling compressIntakeRequests in pure uniapp projects
* GCUniPlugin-MobileAgent enableDataIntegerCompatible enabled by default
* Compatible with iOS 1.5.10, 1.5.11, 1.5.12, 1.5.13, 1.5.14, Android ft-sdk 1.6.8, 1.6.9 

---
# 0.2.0
* Compatible with iOS 1.5.9
* Android ft-sdk 1.6.7, ft-native:1.1.1, ft-plugin-legacy 1.1.8
* Support Open Dataway direct transmission
* Support uni mini-program and native App hybrid development
* `GCUniPlugin-MobileAgent`
    * Support autonomous management of data synchronization timing through autoSync = false, flushSyncData(), default automatic synchronization
    * Support setting data synchronization page size and synchronization interval time through syncPageSize, syncSleepTime
    * Support deflate compression configuration for synchronized data through compressIntakeRequests
    * Support enabling data synchronization cache limits through enableLimitWithDbSize = true, dbCacheLimit,
      and support using dbDiscardStrategy to set data discard strategy after cache exceeds limit. After setting,
      rumCacheLimitCount and logCacheLimitCount settings will be ineffective
* `GCUniPlugin-RUM` 
    * Support enabling Native Crash monitoring through enableTrackNativeCrash.
    * Support enabling Native ANR monitoring through enableTrackNativeAppANR.
    * Support enabling Native Free monitoring through enableTrackNativeFreeze, set monitoring threshold range through nativeFreezeDurationMs
    * Support limiting RUM data cache entry count limit through rumCacheLimitCount, rumDiscardStrategy, default 100_000
* `GCUniPlugin-Logger`
    * Support limiting RUM data cache entry count limit through logCacheLimitCount, default 5000

---
# 0.1.2
*  Compatible with iOS 1.4.7-alpha.1, Android 1.3.16-beta02
*  RUM API-addError added optional parameter state 

---
# 0.1.1
*  Compatible with Android 1.3.10-beta01

---
# 0.1.0
*  Compatible with iOS 1.3.10.beta.1, Android 1.3.9-beta02
*  Provide corresponding calling interfaces for Action, View, Longtask, Resource, Log
