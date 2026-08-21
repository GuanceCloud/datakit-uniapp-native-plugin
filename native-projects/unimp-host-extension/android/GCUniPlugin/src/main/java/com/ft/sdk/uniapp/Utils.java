package com.ft.sdk.uniapp;

import com.alibaba.fastjson.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class Utils {

    public static <T> HashMap<String, T> convertJSONtoHashMap(JSONObject property) {
        if (property != null) {
            HashMap<String, T> params = new HashMap<>();
            for (String key : property.keySet()) {
                params.put(key, (T) property.get(key));
            }
            return params;
        }
        return null;
    }

    public static Object firstValue(Map<String, Object> params, String primaryKey, String fallbackKey) {
        Object value = params.get(primaryKey);
        return value != null ? value : params.get(fallbackKey);
    }

    /**
     * Merge bridgeContext into property
     * @param property original property
     * @return merged property
     */
    public static HashMap<String, Object> mergeBridgeContext(JSONObject property) {
        HashMap<String, Object> params = convertJSONtoHashMap(property);
        if (params == null) {
            params = new HashMap<>();
        }

        // Get and merge bridgeContext
        Map<String, Object> bridgeContext = FTSDKUniModule.getBridgeContext();
        if (!bridgeContext.isEmpty()) {
            params.putAll(bridgeContext);
        }

        return params;
    }
}
