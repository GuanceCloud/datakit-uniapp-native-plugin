package com.ft.sdk.uniapp;

import com.alibaba.fastjson.JSONObject;
import com.ft.sdk.FTSdk;
import com.ft.sdk.FTTraceConfig;
import com.ft.sdk.FTTraceManager;
import com.ft.sdk.TraceType;

import java.util.HashMap;
import java.util.Map;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.common.UniModule;

public class FTTracerModule extends UniModule {

    @UniJSMethod(uiThread = false)
    public void setConfig(JSONObject data) {
        Map<String, Object> map = Utils.convertJSONtoHashMap(data);
        Number sampleRate = (Number) map.get("sampleRate");
        Object traceType =  (map.get("traceType"));
        Boolean enableLinkRUMData = (Boolean) map.get("enableLinkRUMData");
        Boolean enableNativeAutoTrace = (Boolean) map.get("enableNativeAutoTrace");

        FTTraceConfig traceConfig = new FTTraceConfig();
        if (sampleRate != null) {
            traceConfig.setSamplingRate(sampleRate.floatValue());
        }

        if (traceType != null) {
            if (traceType.equals("ddTrace")) {
                traceConfig.setTraceType(TraceType.DDTRACE);
            } else if (traceType.equals("zipkinMultiHeader")) {
                traceConfig.setTraceType(TraceType.ZIPKIN_MULTI_HEADER);
            } else if (traceType.equals("zipkinSingleHeader")) {
                traceConfig.setTraceType(TraceType.ZIPKIN_SINGLE_HEADER);
            } else if (traceType.equals("traceparent")) {
                traceConfig.setTraceType(TraceType.TRACEPARENT);
            } else if (traceType.equals("skywalking")) {
                traceConfig.setTraceType(TraceType.SKYWALKING);
            } else if (traceType.equals("jaeger")) {
                traceConfig.setTraceType(TraceType.JAEGER);
            }
        }

        if (enableLinkRUMData != null) {
            traceConfig.setEnableLinkRUMData(enableLinkRUMData);
        }

        if (enableNativeAutoTrace != null) {
            traceConfig.setEnableAutoTrace(enableNativeAutoTrace);
        }

        FTSdk.initTraceWithConfig(traceConfig);
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
