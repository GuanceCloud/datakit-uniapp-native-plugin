package com.ft.sdk.uniapp;


import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.ft.sdk.FTLogger;
import com.ft.sdk.FTLoggerConfig;
import com.ft.sdk.FTSdk;
import com.ft.sdk.LogCacheDiscard;
import com.ft.sdk.garble.bean.Status;

import java.util.HashMap;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.common.UniModule;

public class FTLogModule extends UniModule {


    @UniJSMethod(uiThread = false)
    public void setConfig(JSONObject data) {
        FTLoggerConfig config = new FTLoggerConfig();

        Float sampleRate = data.getFloat("samplerate");
        if (sampleRate != null) {
            config.setSamplingRate(sampleRate);
        }
        Boolean enableLinkRumData = data.getBoolean("enableLinkRumData");
        if (enableLinkRumData != null) {
            config.setEnableLinkRumData(enableLinkRumData);
        }

        Boolean enableCustomLog = data.getBoolean("enableCustomLog");
        if (enableCustomLog != null) {
            config.setEnableCustomLog(enableCustomLog);
        }

        String discardStrategy = data.getString("discardStrategy");
        if (discardStrategy != null) {
            if (discardStrategy.equals("discardOldest")) {
                config.setLogCacheDiscardStrategy(LogCacheDiscard.DISCARD_OLDEST);
            } else if (discardStrategy.equals("discard")) {
                config.setLogCacheDiscardStrategy(LogCacheDiscard.DISCARD);
            }

        }
        JSONArray logLevelFilters = data.getJSONArray("logLevelFilters");
        if (logLevelFilters != null) {
            Status[] statuses = new Status[logLevelFilters.size()];
            for (int i = 0; i < logLevelFilters.size(); i++) {
                Status logStatus = null;
                for (Status value : Status.values()) {
                    if (value.name.equals(logLevelFilters.getString(i))) {
                        logStatus = value;
                        break;
                    }
                }
                statuses[i] = logStatus;
            }

            config.setLogLevelFilters(statuses);

        }

        JSONObject globalContext = data.getJSONObject("globalContext");
        if (globalContext != null) {
            for (String key : globalContext.keySet()) {
                config.addGlobalContext(key, globalContext.getString(key));
            }
        }

        FTSdk.initLogWithConfig(config);

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
