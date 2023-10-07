package com.ft.sdk.uniapp;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.ft.sdk.DetectFrequency;
import com.ft.sdk.DeviceMetricsMonitorType;
import com.ft.sdk.ErrorMonitorType;
import com.ft.sdk.FTRUMConfig;
import com.ft.sdk.FTRUMGlobalManager;
import com.ft.sdk.FTSdk;
import com.ft.sdk.garble.bean.AppState;
import com.ft.sdk.garble.bean.ErrorType;
import com.ft.sdk.garble.bean.NetStatusBean;
import com.ft.sdk.garble.bean.ResourceParams;

import java.util.HashMap;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.common.UniModule;

public class FTRUMModule extends UniModule {

    @UniJSMethod(uiThread = false)
    public void setConfig(JSONObject data) {
        FTRUMConfig rumConfig = new FTRUMConfig();
        String appId = data.getString("androidAppId");
        rumConfig.setRumAppId(appId);
        Float sampleRate = data.getFloat("samplerate");
        if (sampleRate != null) {
            rumConfig.setSamplingRate(sampleRate);
        }
        Boolean enableNativeUserAction = data.getBoolean("enableNativeUserAction");
        if (enableNativeUserAction != null) {
            rumConfig.setEnableTraceUserAction(enableNativeUserAction);
        }

        Boolean enableNativeUserView = data.getBoolean("enableNativeUserView");
        if (enableNativeUserView != null) {
            rumConfig.setEnableTraceUserView(enableNativeUserView);
        }

        Boolean enableNativeUserResource = data.getBoolean("enableNativeUserResource");
        if (enableNativeUserResource != null) {
            rumConfig.setEnableTraceUserResource(enableNativeUserResource);
        }

        Object errorType = data.get("errorMonitorType");
        if (errorType != null) {
            int errorMonitorType = ErrorMonitorType.NO_SET;
            if (errorType instanceof String) {
                if (errorType.equals("all")) {
                    errorMonitorType = ErrorMonitorType.ALL.getValue();
                } else if (errorType.equals("battery")) {
                    errorMonitorType = ErrorMonitorType.BATTERY.getValue();
                } else if (errorType.equals("memory")) {
                    errorMonitorType = ErrorMonitorType.MEMORY.getValue();
                } else if (errorType.equals("cpu")) {
                    errorMonitorType = ErrorMonitorType.CPU.getValue();
                }
            } else if (errorType instanceof JSONArray) {
                JSONArray errorTypeArr = (JSONArray) errorType;
                for (int i = 0; i < errorTypeArr.size(); i++) {
                    String errorTypeStr = errorTypeArr.getString(i);
                    if (errorTypeStr.equals("all")) {
                        errorMonitorType |= ErrorMonitorType.ALL.getValue();
                    } else if (errorTypeStr.equals("battery")) {
                        errorMonitorType |= ErrorMonitorType.BATTERY.getValue();
                    } else if (errorTypeStr.equals("memory")) {
                        errorMonitorType |= ErrorMonitorType.MEMORY.getValue();
                    } else if (errorTypeStr.equals("cpu")) {
                        errorMonitorType |= ErrorMonitorType.CPU.getValue();
                    }
                }
            }
            rumConfig.setExtraMonitorTypeWithError(errorMonitorType);

        }

        Object deviceType = data.get("deviceMonitorType");
        if (deviceType != null) {
            String detectFrequencyStr = data.getString("detectFrequency");

            DetectFrequency detectFrequency = DetectFrequency.DEFAULT;
            if (detectFrequencyStr != null) {
//                if (detectFrequencyStr.equals("normal")) {
//                    detectFrequency = DetectFrequency.DEFAULT;
//                } else
                if (detectFrequencyStr.equals("frequent")) {
                    detectFrequency = DetectFrequency.FREQUENT;
                } else if (detectFrequencyStr.equals("rare")) {
                    detectFrequency = DetectFrequency.RARE;
                }
            }

            int deviceMonitorType = DeviceMetricsMonitorType.NO_SET;
            if (deviceType instanceof String) {
                if (deviceType.equals("all")) {
                    deviceMonitorType = DeviceMetricsMonitorType.ALL.getValue();
                } else if (deviceType.equals("battery")) {
                    deviceMonitorType = DeviceMetricsMonitorType.BATTERY.getValue();
                } else if (deviceType.equals("memory")) {
                    deviceMonitorType = DeviceMetricsMonitorType.MEMORY.getValue();
                } else if (deviceType.equals("cpu")) {
                    deviceMonitorType = DeviceMetricsMonitorType.CPU.getValue();
                } else if (deviceType.equals("fps")) {
                    deviceMonitorType = DeviceMetricsMonitorType.FPS.getValue();
                }
            } else if (deviceType instanceof JSONArray) {
                JSONArray deviceTypeArr = (JSONArray) deviceType;
                for (int i = 0; i < deviceTypeArr.size(); i++) {
                    String deviceTypeStr = deviceTypeArr.getString(i);
                    if (deviceTypeStr.equals("all")) {
                        deviceMonitorType |= DeviceMetricsMonitorType.ALL.getValue();
                    } else if (deviceTypeStr.equals("battery")) {
                        deviceMonitorType |= DeviceMetricsMonitorType.BATTERY.getValue();
                    } else if (deviceTypeStr.equals("memory")) {
                        deviceMonitorType |= DeviceMetricsMonitorType.MEMORY.getValue();
                    } else if (deviceTypeStr.equals("cpu")) {
                        deviceMonitorType |= DeviceMetricsMonitorType.CPU.getValue();
                    } else if (deviceTypeStr.equals("fps")) {
                        deviceMonitorType |= DeviceMetricsMonitorType.FPS.getValue();
                    }
                }
            }
            rumConfig.setDeviceMetricsMonitorType(deviceMonitorType, detectFrequency);
        }

        JSONObject globalContext = data.getJSONObject("globalContext");
        if (globalContext != null) {
            for (String key : globalContext.keySet()) {
                rumConfig.addGlobalContext(key, globalContext.getString(key));
            }
        }

        FTSdk.initRUMWithConfig(rumConfig);
        FTUniAppStartManager.get().uploadColdBootTimeWhenManualStart();
    }

    @UniJSMethod(uiThread = false)
    public void startAction(JSONObject data) {
        String actionName = data.getString("actionName");
        String actionType = data.getString("actionType");
        JSONObject property = data.getJSONObject("property");
        HashMap<String, Object> params = Utils.convertJSONtoHashMap(property);
        FTRUMGlobalManager.get().startAction(actionName, actionType, params);

    }

    @UniJSMethod(uiThread = false)
    public void onCreateView(JSONObject data) {
        String viewName = data.getString("viewName");
        long loadTime = data.getLong("loadTime");
        FTRUMGlobalManager.get().onCreateView(viewName, loadTime);
    }

    @UniJSMethod(uiThread = false)
    public void startView(JSONObject data) {
        String viewName = data.getString("viewName");
        JSONObject property = data.getJSONObject("property");
        HashMap<String, Object> params = Utils.convertJSONtoHashMap(property);
        FTRUMGlobalManager.get().startView(viewName, params);
    }

    @UniJSMethod(uiThread = false)
    public void stopView(JSONObject data) {
        if (data != null) {
            JSONObject property = data.getJSONObject("property");
            HashMap<String, Object> params = Utils.convertJSONtoHashMap(property);
            FTRUMGlobalManager.get().stopView(params);
        } else {
            FTRUMGlobalManager.get().stopView();
        }
    }

    @UniJSMethod(uiThread = false)
    public void addError(JSONObject data) {
        String message = data.getString("message");
        String stack = data.getString("stack");
        JSONObject property = data.getJSONObject("property");
        HashMap<String, Object> params = Utils.convertJSONtoHashMap(property);
        FTRUMGlobalManager.get().addError(message, stack, ErrorType.JAVA, AppState.RUN, params);
    }


    @UniJSMethod(uiThread = false)
    public void startResource(JSONObject data) {
        String key = data.getString("key");
        JSONObject property = data.getJSONObject("property");
        HashMap<String, Object> params = Utils.convertJSONtoHashMap(property);
        FTRUMGlobalManager.get().startResource(key, params);

    }

    @UniJSMethod(uiThread = false)
    public void stopResource(JSONObject data) {
        String key = data.getString("key");
        JSONObject property = data.getJSONObject("property");
        HashMap<String, Object> params = Utils.convertJSONtoHashMap(property);
        FTRUMGlobalManager.get().stopResource(key);
    }

    @UniJSMethod(uiThread = false)
    public void addResource(JSONObject data) {
        String key = data.getString("key");
        JSONObject content = data.getJSONObject("content");
        if (content == null) {
            return;
        }
        ResourceParams params = new ResourceParams();
        params.url = content.getString("url");
        params.resourceMethod = content.getString("httpMethod");
        params.requestHeader = content.getString("requestHeader");
        params.responseHeader = content.getString("responseHeader");
        params.responseBody = content.getString("responseBody");
        params.resourceStatus = content.getIntValue("resourceStatus");
        NetStatusBean netStatusBean = new NetStatusBean();
        FTRUMGlobalManager.get().addResource(key, params, netStatusBean);


    }
}
