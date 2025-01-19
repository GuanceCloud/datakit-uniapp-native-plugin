package com.ft.sdk.uniapp;


import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.ft.sdk.FTLogger;
import com.ft.sdk.FTLoggerConfig;
import com.ft.sdk.FTSdk;
import com.ft.sdk.LogCacheDiscard;
import com.ft.sdk.garble.bean.Status;

import java.util.HashMap;
import java.util.Map;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.common.UniModule;

public class FTLogModule extends UniModule {


    @UniJSMethod(uiThread = false)
    public void setConfig(JSONObject data) {
        Map<String, Object> map = Utils.convertJSONtoHashMap(data);
        String discardStrategy = (String) (map.get("discardStrategy"));
        Number sampleRate = (Number) map.get("samplerate");
        JSONArray logTypeReadArr = (JSONArray) map.get("logLevelFilters");
        Boolean enableLinkRumData = (Boolean) map.get("enableLinkRumData");
        Boolean enableCustomLog = (Boolean) map.get("enableCustomLog");
        Map<String, Object> globalContext = (Map<String, Object>) map.get("globalContext");
        Number logCacheLimitCount = (Number) map.get("logCacheLimitCount");

        FTLoggerConfig logConfig = new FTLoggerConfig();

        if (enableCustomLog != null) {
            logConfig.setEnableCustomLog(enableCustomLog);
        }
        if (sampleRate != null) {
            logConfig.setSamplingRate(sampleRate.floatValue());
        }

        if (discardStrategy != null) {
            if (discardStrategy.equals("discardOldest")) {
                logConfig.setLogCacheDiscardStrategy(LogCacheDiscard.DISCARD_OLDEST);
            } else if (discardStrategy.equals("discard")) {
                logConfig.setLogCacheDiscardStrategy(LogCacheDiscard.DISCARD);
            }
        }

        if (logTypeReadArr != null) {
            Status[] statuses = new Status[logTypeReadArr.size()];
            for (int i = 0; i < logTypeReadArr.size(); i++) {
                Status logStatus = null;
                for (Status value : Status.values()) {
                    if (value.name.equals(logTypeReadArr.get(i))) {
                        logStatus = value;
                        break;
                    }
                }
                statuses[i] = logStatus;
            }

            logConfig.setLogLevelFilters(statuses);

        }

        if (enableLinkRumData != null) {
            logConfig.setEnableLinkRumData(enableLinkRumData);
        }

        if (enableCustomLog != null) {
            logConfig.setEnableCustomLog(enableCustomLog);
        }

        if (globalContext != null) {
            for (Map.Entry<String, Object> entry : globalContext.entrySet()) {
                logConfig.addGlobalContext(entry.getKey(), entry.getValue().toString());
            }
        }

        if (logCacheLimitCount != null) {
            logConfig.setLogCacheLimitCount(logCacheLimitCount.intValue());
        }

        FTSdk.initLogWithConfig(logConfig);

    }

    @UniJSMethod(uiThread = false)
    public void logging(JSONObject data) {
        String content = data.getString("content");
        String status = data.getString("status");
        JSONObject property = data.getJSONObject("property");
        if (content != null && status != null) {
            HashMap<String, Object> propertyMap = Utils.convertJSONtoHashMap(property);
            Status logStatus = null;
            for (Status value : Status.values()) {
                if (value.name.equals(status)) {
                    logStatus = value;
                    break;
                }
            }
            FTLogger.getInstance().logBackground(content, logStatus, propertyMap);
        }
    }


}
