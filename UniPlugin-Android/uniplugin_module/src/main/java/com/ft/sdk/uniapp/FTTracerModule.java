package com.ft.sdk.uniapp;

import com.alibaba.fastjson.JSONObject;
import com.ft.sdk.FTSdk;
import com.ft.sdk.FTTraceConfig;
import com.ft.sdk.FTTraceManager;
import com.ft.sdk.TraceType;

import java.util.HashMap;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.common.UniModule;

public class FTTracerModule extends UniModule {

    @UniJSMethod(uiThread = false)
    public void setConfig(JSONObject data) {
        FTTraceConfig config = new FTTraceConfig();
        Float sampleRate = data.getFloat("samplerate");
        if (sampleRate != null) {
            config.setSamplingRate(sampleRate);
        }

        String traceType = data.getString("traceType");
        if (traceType != null) {
            if (traceType.equals("ddTrace")) {
                config.setTraceType(TraceType.DDTRACE);
            } else if (traceType.equals("zipkinMultiHeader")) {
                config.setTraceType(TraceType.ZIPKIN_MULTI_HEADER);
            } else if (traceType.equals("zipkinSingleHeader")) {
                config.setTraceType(TraceType.ZIPKIN_SINGLE_HEADER);
            } else if (traceType.equals("traceparent")) {
                config.setTraceType(TraceType.TRACEPARENT);
            } else if (traceType.equals("skywalking")) {
                config.setTraceType(TraceType.SKYWALKING);
            } else if (traceType.equals("jaeger")) {
                config.setTraceType(TraceType.JAEGER);
            }
        }

        Boolean enableLinkRumData = data.getBoolean("enableLinkRUMData");
        if (enableLinkRumData != null) {
            config.setEnableLinkRUMData(enableLinkRumData);
        }
        Boolean enableAutoTrace = data.getBoolean("enableAutoTrace");
        if (enableAutoTrace != null) {
            config.setEnableAutoTrace(enableAutoTrace);
        }
        FTSdk.initTraceWithConfig(config);
    }


    @UniJSMethod(uiThread = false)
    public JSONObject getTraceHeader(JSONObject data) {
        String key = data.getString("key");
        String url = data.getString("url");
        if (key != null && url != null) {
            JSONObject result = new JSONObject();
            HashMap<String, String> headerMap = FTTraceManager.get().getTraceHeader(key, url);
            for (String headerKey : headerMap.keySet()) {
                result.put(headerKey, headerMap.get(headerKey));
            }
            return result;
        }
        return null;
    }

}
