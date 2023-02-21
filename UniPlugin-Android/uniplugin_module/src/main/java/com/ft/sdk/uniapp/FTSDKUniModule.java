package com.ft.sdk.uniapp;

import com.alibaba.fastjson.JSONObject;
import com.ft.sdk.EnvType;
import com.ft.sdk.FTSDKConfig;
import com.ft.sdk.FTSdk;
import com.ft.sdk.garble.bean.UserData;

import java.util.HashMap;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.common.UniModule;

public class FTSDKUniModule extends UniModule {


    @UniJSMethod(uiThread = false)
    public void sdkConfig(JSONObject data) {
        String serverUrl = data.getString("serverUrl");
        if (serverUrl != null) {
            FTSDKConfig config = FTSDKConfig.builder(serverUrl);
            config.setDebug(data.getBooleanValue("debug"));
            String env = data.getString("env");
            if (env != null) {
                config.setEnv(EnvType.valueOf(env.toUpperCase()));
            }

            JSONObject globalContext = data.getJSONObject("globalContext");
            if (globalContext != null) {
                for (String key : globalContext.keySet()) {
                    config.addGlobalContext(key, globalContext.getString(key));
                }
            }

            String service = data.getString("service");
            if (service != null) {
                config.setServiceName(service);
            }
            FTSdk.install(config);

            Boolean isOffline = data.getBoolean("offlinePackage");
            if (isOffline == null || !isOffline) {
                FTUniAppStartManager.get().start();
            }
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


    /**
     * 手动设置应用启动时间
     */
    @UniJSMethod(uiThread = true)
    public void manuallySetApplicationStart() {
        FTUniAppStartManager.get().start();
    }
}
