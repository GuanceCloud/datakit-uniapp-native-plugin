package com.ft.sdk.uniapp;

import com.alibaba.fastjson.JSONObject;
import com.ft.sdk.DBCacheDiscard;
import com.ft.sdk.FTSDKConfig;
import com.ft.sdk.FTSdk;
import com.ft.sdk.InnerClassProxy;
import com.ft.sdk.garble.bean.UserData;

import java.util.HashMap;
import java.util.Map;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.common.UniModule;
import uni.dcloud.io.uniplugin_module.BuildConfig;

public class FTSDKUniModule extends UniModule {

    private final static String KEY_VERSION_SDK_PACKAGE_UNIAPP = "sdk_package_uniapp";


    @UniJSMethod(uiThread = false)
    public void sdkConfig(JSONObject data) {
        Map<String, Object> map = Utils.convertJSONtoHashMap(data);
        String serverUrl = (String) map.get("serverUrl");
        String datakitUrl = (String) map.get("datakitUrl");
        if (datakitUrl == null) {
            //兼容旧版本
            datakitUrl = serverUrl;
        }
        String datawayUrl = (String) map.get("datawayUrl");
        String cliToken = (String) map.get("clientToken");
        Boolean debug = (Boolean) map.get("debug");
        Boolean autoSync = (Boolean) map.get("autoSync");
        Number syncPageSize = (Number) map.get("syncPageSize");
        Number syncSleepTime = (Number) map.get("syncSleepTime");
        Boolean enableDataIntegerCompatible = (Boolean) map.get("enableDataIntegerCompatible");
        Boolean compressIntakeRequests = (Boolean) map.get("compressIntakeRequests");
        String serviceName = (String) map.get("service");
        Map<String, Object> globalContext = (Map<String, Object>) map.get("globalContext");
        Boolean enableLimitWithDbSize = (Boolean) map.get("enableLimitWithDbSize");
        Number dbCacheLimit = (Number) (map.get("dbCacheLimit"));
        Object dbDiscardStrategy = map.get("dbDiscardStrategy");

        FTSDKConfig sdkConfig = (datakitUrl != null)
                ? FTSDKConfig.builder(datakitUrl)
                : FTSDKConfig.builder(datawayUrl, cliToken);

        String envString = (String) map.get("env");
        if (envString != null) {
            sdkConfig.setEnv(envString);
        }

        if (debug != null) {
            sdkConfig.setDebug(debug);
        }
        if (serviceName != null) {
            sdkConfig.setServiceName(serviceName);
        }
        if (autoSync != null) {
            sdkConfig.setAutoSync(autoSync);
        }
        if (syncPageSize != null) {
            sdkConfig.setCustomSyncPageSize(syncPageSize.intValue());
        }
        if (syncSleepTime != null) {
            sdkConfig.setSyncSleepTime(syncSleepTime.intValue());
        }
        if (enableDataIntegerCompatible != null && enableDataIntegerCompatible) {
            sdkConfig.enableDataIntegerCompatible();
        }
        if (compressIntakeRequests != null && compressIntakeRequests) {
            sdkConfig.setCompressIntakeRequests(compressIntakeRequests);
        }
        if (globalContext != null) {
            for (Map.Entry<String, Object> entry : globalContext.entrySet()) {
                sdkConfig.addGlobalContext(entry.getKey(), entry.getValue().toString());
            }
        }
        if (enableLimitWithDbSize != null && enableLimitWithDbSize) {
            if (dbCacheLimit != null) {
                sdkConfig.enableLimitWithDbSize(dbCacheLimit.longValue());
            } else {
                sdkConfig.enableLimitWithDbSize();
            }
        }
        if (dbDiscardStrategy != null) {
            if (dbDiscardStrategy.equals("discardOldest")) {
                sdkConfig.setDbCacheDiscard(DBCacheDiscard.DISCARD_OLDEST);
            } else if (dbDiscardStrategy.equals("discard")) {
                sdkConfig.setDbCacheDiscard(DBCacheDiscard.DISCARD);
            }
        }
        InnerClassProxy.addPkgInfo(sdkConfig, "uniapp", BuildConfig.FT_UNI_APP_SDK_VERSION);

        FTSdk.install(sdkConfig);


        Boolean isOffline = data.getBoolean("offlinePackage");
        if (isOffline == null || !isOffline) {
            FTUniAppStartManager.get().start();
        }
    }


    @UniJSMethod(uiThread = false)
    public void bindRUMUserData(JSONObject data) {
        UserData userData = new UserData();
        String userId = data.getString("userId");
        String userName = data.getString("userName");
        String userEmail = data.getString("userEmail");
        JSONObject extra = data.getJSONObject("extra");
        if (userId != null) {
            userData.setId(userId);
        }
        if (userName != null) {
            userData.setName(userName);
        }
        if (userEmail != null) {
            userData.setEmail(userEmail);
        }
        if (extra != null) {
            HashMap<String, String> hashMap = Utils.convertJSONtoHashMap(extra);
            userData.setExts(hashMap);
        }

        FTSdk.bindRumUserData(userData);
    }

    @UniJSMethod(uiThread = false)
    public void unbindRUMUserData() {
        FTSdk.unbindRumUserData();
    }


    @UniJSMethod(uiThread = false)
    public void flushSyncData() {
        FTSdk.flushSyncData();
    }

    @UniJSMethod(uiThread = false)
    public void appendGlobalContext(JSONObject extra) {
        if (extra != null) {
            FTSdk.appendGlobalContext(Utils.convertJSONtoHashMap(extra));
        }
    }

    @UniJSMethod(uiThread = false)
    public void appendLogGlobalContext(JSONObject extra) {
        if (extra != null) {
            FTSdk.appendLogGlobalContext(Utils.convertJSONtoHashMap(extra));
        }
    }

    @UniJSMethod(uiThread = false)
    public void appendRUMGlobalContext(JSONObject extra) {
        if (extra != null) {
            FTSdk.appendRUMGlobalContext(Utils.convertJSONtoHashMap(extra));
        }
    }

    @UniJSMethod(uiThread = false)
    public void shutDown() {
        FTSdk.shutDown();
    }

    @UniJSMethod(uiThread = false)
    public void clearAllData() {
        FTSdk.clearAllData();
    }

    /**
     * 手动设置应用启动时间
     */
    @UniJSMethod(uiThread = true)
    public void manuallySetApplicationStart() {
        FTUniAppStartManager.get().start();
    }
}
