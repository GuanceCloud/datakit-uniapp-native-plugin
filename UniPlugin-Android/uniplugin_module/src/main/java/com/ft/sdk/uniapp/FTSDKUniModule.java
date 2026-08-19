package com.ft.sdk.uniapp;

import com.alibaba.fastjson.JSONObject;
import com.ft.sdk.DBCacheDiscard;
import com.ft.sdk.DataModifier;
import com.ft.sdk.FTRemoteConfigManager;
import com.ft.sdk.FTSDKConfig;
import com.ft.sdk.FTSdk;
import com.ft.sdk.LineDataModifier;
import com.ft.sdk.garble.bean.RemoteConfigBean;
import com.ft.sdk.garble.bean.UserData;
import com.ft.sdk.garble.utils.Constants;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.bridge.UniJSCallback;
import io.dcloud.feature.uniapp.common.UniModule;

public class FTSDKUniModule extends UniModule {

    private static final Map<String, Object> bridgeContext = new ConcurrentHashMap<>();
    private static volatile boolean remoteConfigurationEnabled = false;

    static {
        bridgeContext.put("sdk_bridge_info",
                "{\"uniapp\":\"" + BuildConfig.FT_UNI_APP_SDK_VERSION + "\"}");
    }


    @UniJSMethod(uiThread = false)
    public void sdkConfig(JSONObject data) {
        Map<String, Object> map = Utils.convertJSONtoHashMap(data);
        String serverUrl = (String) map.get("serverUrl");
        String datakitUrl = (String) map.get("datakitUrl");
        if (datakitUrl == null) {
            //Compatible with old version
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
        final Map<String, Object> dataModifier = (Map<String, Object>) map.get("dataModifier");
        final Map<String, Map<String, Object>> lineDataModifier = (Map<String, Map<String, Object>>) map.get("lineDataModifier");
        Boolean remoteConfiguration = (Boolean) map.get("remoteConfiguration");
        Number remoteConfigMiniUpdateInterval = (Number) map.get("remoteConfigMiniUpdateInterval");
        Boolean enableDataFilter = (Boolean) map.get("enableDataFilter");
        HashMap<String, String[]> dataFilters = convertDataFilters(map.get("dataFilters"));

        FTSDKConfig sdkConfig;
        if (datakitUrl != null && !datakitUrl.isEmpty()) {
            sdkConfig = FTSDKConfig.builder(datakitUrl);
        } else if (datawayUrl != null && !datawayUrl.isEmpty()
                && cliToken != null && !cliToken.isEmpty()) {
            sdkConfig = FTSDKConfig.builder(datawayUrl, cliToken);
        } else {
            sdkConfig = FTSDKConfig.builder();
        }

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
        if (dataModifier != null) {
            sdkConfig.setDataModifier(new DataModifier() {
                @Override
                public Object modify(String key, Object value) {
                    return dataModifier.get(key);
                }
            });
        }
        if (lineDataModifier != null) {
            sdkConfig.setLineDataModifier(new LineDataModifier() {
                @Override
                public Map<String, Object> modify(String measurement, HashMap<String, Object> data) {
                    if (measurement.equals(Constants.FT_LOG_DEFAULT_MEASUREMENT)) {
                        return lineDataModifier.get("log");
                    } else {
                        return lineDataModifier.get(measurement);
                    }
                }
            });
        }
        if (remoteConfiguration != null) {
            sdkConfig.setRemoteConfiguration(remoteConfiguration);
        }
        if (remoteConfigMiniUpdateInterval != null) {
            sdkConfig.setRemoteConfigMiniUpdateInterval(
                    Math.max(0, remoteConfigMiniUpdateInterval.intValue()));
        }
        if (enableDataFilter != null) {
            sdkConfig.setEnableDataFilter(enableDataFilter);
        }
        if (dataFilters != null) {
            sdkConfig.setDataFilters(dataFilters);
        }
        FTSdk.install(sdkConfig);
        remoteConfigurationEnabled = remoteConfiguration != null && remoteConfiguration;


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
        remoteConfigurationEnabled = false;
    }

    @UniJSMethod(uiThread = false)
    public void clearAllData() {
        FTSdk.clearAllData();
    }

    @UniJSMethod(uiThread = false)
    public void setDatakitURL(JSONObject data) {
        if (data == null) {
            return;
        }
        String datakitUrl = data.getString("datakitUrl");
        if (datakitUrl != null && !datakitUrl.isEmpty()) {
            FTSdk.setDatakitUrl(datakitUrl);
        }
    }

    @UniJSMethod(uiThread = false)
    public void setDatawayURL(JSONObject data) {
        if (data == null) {
            return;
        }
        String datawayUrl = data.getString("datawayUrl");
        String clientToken = data.getString("clientToken");
        if (datawayUrl != null && !datawayUrl.isEmpty()
                && clientToken != null && !clientToken.isEmpty()) {
            FTSdk.setDatawayUrl(datawayUrl, clientToken);
        }
    }

    @UniJSMethod(uiThread = false)
    public void updateRemoteConfigWithMiniUpdateInterval(JSONObject data,
                                                          final UniJSCallback callback) {
        if (!remoteConfigurationEnabled) {
            invokeRemoteConfigCallback(callback, false, null,
                    "REMOTE_CONFIG_DISABLED", "Remote configuration is not enabled.");
            return;
        }
        Number interval = data == null ? null : data.getInteger("miniUpdateInterval");
        int miniUpdateInterval = interval == null ? 0 : Math.max(0, interval.intValue());
        FTSdk.updateRemoteConfig(miniUpdateInterval, new FTRemoteConfigManager.FetchResult() {
            private String rawJson;

            @Override
            public RemoteConfigBean onConfigSuccessFetched(RemoteConfigBean configBean,
                                                            String jsonConfig) {
                rawJson = jsonConfig;
                return null;
            }

            @Override
            public void onResult(boolean success) {
                invokeRemoteConfigCallback(callback, success, rawJson,
                        success ? null : "REMOTE_CONFIG_UPDATE_FAILED",
                        success ? null : "Remote configuration update failed.");
            }
        });
    }

    /**
     * Manually set application startup time
     */
    @UniJSMethod(uiThread = true)
    public void manuallySetApplicationStart() {
        FTUniAppStartManager.get().start();
    }

    @UniJSMethod(uiThread = true)
    public void appendBridgeContext(JSONObject context) {
        if (context != null) {
            bridgeContext.putAll(Utils.convertJSONtoHashMap(context));
        }
    }

    /**
     * Get bridge context for use by FTRUMModule
     *
     * @return bridgeContext bridge context
     */
    public static Map<String, Object> getBridgeContext() {
        return bridgeContext;
    }

    private static HashMap<String, String[]> convertDataFilters(Object value) {
        if (!(value instanceof Map)) {
            return null;
        }
        HashMap<String, String[]> result = new HashMap<>();
        Map<?, ?> filters = (Map<?, ?>) value;
        for (Map.Entry<?, ?> entry : filters.entrySet()) {
            if (!(entry.getKey() instanceof String) || !(entry.getValue() instanceof List)) {
                continue;
            }
            List<?> values = (List<?>) entry.getValue();
            int ruleCount = 0;
            for (Object rule : values) {
                if (rule != null) {
                    ruleCount++;
                }
            }
            String[] rules = new String[ruleCount];
            int index = 0;
            for (Object rule : values) {
                if (rule != null) {
                    rules[index++] = String.valueOf(rule);
                }
            }
            result.put((String) entry.getKey(), rules);
        }
        return result;
    }

    private static void invokeRemoteConfigCallback(UniJSCallback callback, boolean success,
                                                    String rawJson, String errorCode,
                                                    String errorMessage) {
        if (callback == null) {
            return;
        }
        JSONObject result = new JSONObject();
        result.put("success", success);
        result.put("platform", "android");
        if (rawJson != null) {
            result.put("rawJson", rawJson);
        }
        if (errorCode != null) {
            result.put("errorCode", errorCode);
        }
        if (errorMessage != null) {
            result.put("errorMessage", errorMessage);
        }
        callback.invoke(result);
    }
}
