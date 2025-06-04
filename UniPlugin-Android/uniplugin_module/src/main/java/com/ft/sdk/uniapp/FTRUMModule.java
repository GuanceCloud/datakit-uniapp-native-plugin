package com.ft.sdk.uniapp;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.ft.sdk.DetectFrequency;
import com.ft.sdk.DeviceMetricsMonitorType;
import com.ft.sdk.ErrorMonitorType;
import com.ft.sdk.FTRUMConfig;
import com.ft.sdk.FTRUMGlobalManager;
import com.ft.sdk.FTSdk;
import com.ft.sdk.RUMCacheDiscard;
import com.ft.sdk.garble.bean.AppState;
import com.ft.sdk.garble.bean.NetStatusBean;
import com.ft.sdk.garble.bean.ResourceParams;

import java.util.HashMap;
import java.util.Map;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.common.UniModule;

public class FTRUMModule extends UniModule {
    private static final String DEFAULT_ERROR_TYPE = "uniapp_crash";

    @UniJSMethod(uiThread = false)
    public void setConfig(JSONObject data) {
        Map<String, Object> map = Utils.convertJSONtoHashMap(data);
        String rumAppId = (String) map.get("androidAppId");
        Number sampleRate = (Number) map.get("samplerate");
        Number sessionOnErrorSampleRate = (Number) map.get("sessionOnErrorSampleRate");
        Boolean enableNativeUserAction = (Boolean) map.get("enableNativeUserAction");
        Boolean enableNativeUserView = (Boolean) map.get("enableNativeUserView");
        Boolean enableNativeUserResource = (Boolean) map.get("enableNativeUserResource");
        Boolean enableResourceHostIP = (Boolean) map.get("enableResourceHostIP");
        Boolean enableTrackNativeCrash = (Boolean) map.get("enableTrackNativeCrash");
        Boolean enableTrackNativeAppANR = (Boolean) map.get("enableTrackNativeAppANR");
        Boolean enableTrackNativeFreeze = (Boolean) map.get("enableTrackNativeFreeze");
        Number nativeFreezeDurationMs = (Number) map.get("nativeFreezeDurationMs");
        Object errorType =  map.get("errorMonitorType");
        Object deviceType =  map.get("deviceMonitorType");
        Object detectFrequencyStr =  map.get("detectFrequency");
        Map<String, Object> globalContext = (Map<String, Object>) map.get("globalContext");
        Number rumCacheLimitCount = (Number) map.get("rumCacheLimitCount");
        Object rumDiscardStrategy = map.get("rumDiscardStrategy");
        FTRUMConfig rumConfig = new FTRUMConfig().setRumAppId(rumAppId);
        if (sampleRate != null) {
            rumConfig.setSamplingRate(sampleRate.floatValue());
        }
        if (sessionOnErrorSampleRate != null) {
            rumConfig.setSessionErrorSampleRate(sessionOnErrorSampleRate.floatValue());
        }
        if (enableNativeUserAction != null) {
            rumConfig.setEnableTraceUserAction(enableNativeUserAction);
        }
        if (enableNativeUserView != null) {
            rumConfig.setEnableTraceUserView(enableNativeUserView);
        }
        if (enableNativeUserResource != null) {
            rumConfig.setEnableTraceUserResource(enableNativeUserResource);
        }
        if (enableResourceHostIP != null) {
            rumConfig.setEnableResourceHostIP(enableResourceHostIP);
        }
        if (enableTrackNativeCrash != null) {
            rumConfig.setEnableTrackAppCrash(enableTrackNativeCrash);
        }
        if (enableTrackNativeFreeze != null) {
            if (nativeFreezeDurationMs != null) {
                rumConfig.setEnableTrackAppUIBlock(enableTrackNativeFreeze, nativeFreezeDurationMs.longValue());
            } else {
                rumConfig.setEnableTrackAppUIBlock(enableTrackNativeFreeze);
            }
        }
        if (enableTrackNativeAppANR != null) {
            rumConfig.setEnableTrackAppANR(enableTrackNativeAppANR);
        }
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

        if (deviceType != null) {

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

        if (globalContext != null) {
            for (Map.Entry<String, Object> entry : globalContext.entrySet()) {
                rumConfig.addGlobalContext(entry.getKey(), entry.getValue().toString());
            }
        }
        if (rumCacheLimitCount != null) {
            rumConfig.setRumCacheLimitCount(rumCacheLimitCount.intValue());
        }
        if (rumDiscardStrategy != null) {
            if (rumDiscardStrategy.equals("discardOldest")) {
                rumConfig.setRumCacheDiscardStrategy(RUMCacheDiscard.DISCARD_OLDEST);
            } else if (rumDiscardStrategy.equals("discard")) {
                rumConfig.setRumCacheDiscardStrategy(RUMCacheDiscard.DISCARD);
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
    public void addAction(JSONObject data) {
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
        String state = data.getString("state");
        AppState appState = AppState.UNKNOWN;
        if (state != null) {
            appState = AppState.getValueFrom(state);
        }
        JSONObject property = data.getJSONObject("property");
        HashMap<String, Object> params = Utils.convertJSONtoHashMap(property);
        FTRUMGlobalManager.get().addError(stack, message, DEFAULT_ERROR_TYPE, appState, params);
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
        FTRUMGlobalManager.get().stopResource(key,params);
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
//        Long fetchStartTime = (Long) content.get("fetchStartTime");
//        Long tcpStartTime = (Long) content.get("tcpStartTime");
//        Long tcpEndTime = (Long) content.get("tcpEndTime");
//        Long dnsStartTime = (Long) content.get("dnsStartTime");
//        Long dnsEndTime = (Long) content.get("dnsEndTime");
//        Long responseStartTime = (Long) content.get("responseStartTime");
//        Long responseEndTime = (Long) content.get("responseEndTime");
//        Long sslStartTime = (Long) content.get("sslStartTime");
//        Long sslEndTime = (Long) content.get("sslEndTime");
//        if (fetchStartTime != null) {
//            netStatusBean.fetchStartTime = fetchStartTime;
//        }
//        if (tcpStartTime != null) {
//            netStatusBean.tcpStartTime = tcpStartTime;
//        }
//        if (tcpEndTime != null) {
//            netStatusBean.tcpEndTime = tcpEndTime;
//        }
//        if (dnsStartTime != null) {
//            netStatusBean.dnsStartTime = dnsStartTime;
//        }
//        if (dnsEndTime != null) {
//            netStatusBean.dnsEndTime = dnsEndTime;
//        }
//        if (responseStartTime != null) {
//            netStatusBean.responseStartTime = responseStartTime;
//        }
//        if (responseEndTime != null) {
//            netStatusBean.responseEndTime = responseEndTime;
//        }
//        if (sslStartTime != null) {
//            netStatusBean.sslStartTime = sslStartTime;
//        }
//        if (sslEndTime != null) {
//            netStatusBean.sslEndTime = sslEndTime;
//        }
        FTRUMGlobalManager.get().addResource(key, params, netStatusBean);


    }
}
