package com.example.unimpdemo;

import android.app.Application;
import android.content.Context;
import android.util.Log;

import androidx.multidex.MultiDex;

import com.ft.sdk.FTLoggerConfig;
import com.ft.sdk.FTRUMConfig;
import com.ft.sdk.FTSDKConfig;
import com.ft.sdk.FTSdk;
import com.ft.sdk.FTTraceConfig;
import com.ft.sdk.uniapp.FTLogModule;
import com.ft.sdk.uniapp.FTRUMModule;
import com.ft.sdk.uniapp.FTSDKUniModule;
import com.ft.sdk.uniapp.FTTracerModule;
import com.taobao.weex.WXSDKEngine;

import java.util.ArrayList;
import java.util.List;

import io.dcloud.feature.sdk.DCSDKInitConfig;
import io.dcloud.feature.sdk.DCUniMPSDK;
import io.dcloud.feature.sdk.Interface.IDCUniMPPreInitCallback;
import io.dcloud.feature.sdk.MenuActionSheetItem;

public class App extends Application {
    private static final String TAG = "GCUniMPHost";

    @Override
    public void onCreate() {
        super.onCreate();
        initGuanceSDK();
        registerGuanceModules();

        MenuActionSheetItem aboutItem = new MenuActionSheetItem("关于", "gy");
        MenuActionSheetItem currentPageItem = new MenuActionSheetItem("获取当前页面url", "hqdqym");
        MenuActionSheetItem nativePageItem = new MenuActionSheetItem("跳转到宿主原生测试页面", "gotoTestPage");
        List<MenuActionSheetItem> sheetItems = new ArrayList<>();
        sheetItems.add(aboutItem);
        sheetItems.add(currentPageItem);
        sheetItems.add(nativePageItem);

        DCSDKInitConfig config = new DCSDKInitConfig.Builder()
                .setCapsule(false)
                .setMenuDefFontSize("16px")
                .setMenuDefFontColor("#ff00ff")
                .setMenuDefFontWeight("normal")
                .setMenuActionSheetItems(sheetItems)
                .setEnableBackground(true)
                .setUniMPFromRecents(true)
                .build();
        DCUniMPSDK.getInstance().initialize(this, config, new IDCUniMPPreInitCallback() {
            @Override
            public void onInitFinished(boolean success) {
                Log.i(TAG, "UniMP SDK initialized: " + success);
            }
        });
    }
    private void initGuanceSDK() {
        FTSDKConfig config = FTSDKConfig.builder("http://open-dataway.cn", "client-token");
        config.setDebug(true);
        config.setOnlySupportMainProcess(false);

        FTSdk.install(config);

        FTSdk.initRUMWithConfig(
                new FTRUMConfig()
                        .setRumAppId("guance_android_uniapp_id")
                        .setEnableTraceUserView(true)
                        .setEnableTraceUserAction(true)
                        .setEnableTraceUserResource(true)
                        .setEnableTrackAppUIBlock(true)
                        .setEnableTrackAppCrash(true)
                        .setEnableTrackAppANR(true)
        );
        FTSdk.initLogWithConfig(
                new FTLoggerConfig()
                        .setEnableCustomLog(true)
                        .setEnableLinkRumData(true)
        );

        FTSdk.initTraceWithConfig(
                new FTTraceConfig()
                        .setEnableAutoTrace(true)
                        .setEnableLinkRUMData(true)
        );
    }
    private void registerGuanceModules() {
        try {
            WXSDKEngine.registerModule("GCUniPlugin-MobileAgent", FTSDKUniModule.class);
            WXSDKEngine.registerModule("GCUniPlugin-RUM", FTRUMModule.class);
            WXSDKEngine.registerModule("GCUniPlugin-Logger", FTLogModule.class);
            WXSDKEngine.registerModule("GCUniPlugin-Tracer", FTTracerModule.class);
        } catch (Exception error) {
            throw new IllegalStateException("Unable to register GC UniMP Host Extension", error);
        }
    }

    @Override
    protected void attachBaseContext(Context base) {
        MultiDex.install(base);
        super.attachBaseContext(base);
    }
}
