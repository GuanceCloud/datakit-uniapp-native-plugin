package com.ft.sdk.uniapp;

import com.alibaba.fastjson.JSONObject;

import java.util.HashMap;

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
}
