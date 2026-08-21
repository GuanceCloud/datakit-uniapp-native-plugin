package com.example.unimpdemo;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.view.WindowInsetsController;
import android.widget.Button;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;

import io.dcloud.feature.sdk.DCUniMPSDK;
import io.dcloud.feature.sdk.Interface.IDCUniMPOnCapsuleCloseButtontCallBack;
import io.dcloud.feature.sdk.Interface.IMenuButtonClickCallBack;
import io.dcloud.feature.sdk.Interface.IOnUniMPEventCallBack;
import io.dcloud.feature.sdk.Interface.IUniMP;
import io.dcloud.feature.sdk.Interface.IUniMPOnCloseCallBack;
import io.dcloud.feature.unimp.DCUniMPJSCallback;
import io.dcloud.feature.unimp.config.IUniMPReleaseCallBack;
import io.dcloud.feature.unimp.config.UniMPOpenConfiguration;
import io.dcloud.feature.unimp.config.UniMPReleaseConfiguration;

public class MainActivity extends Activity {
    private static final String UNI_MP_APP_ID = "__UNI__EDA429D";
    private static final String UNI_MP_WGT_ASSET_PATH = "wgt/__UNI__EDA429D.wgt";
    private static final String UNI_MP_WGT_FILE_NAME = "__UNI__EDA429D.wgt";

    Context mContext;
    Handler mHandler;
    /** unimp小程序实例缓存**/
    HashMap<String, IUniMP> mUniMPCaches = new HashMap<>();
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mContext = this;
        mHandler = new Handler();
        setContentView(R.layout.main);
        Button button1 = findViewById(R.id.button1);

        if(Build.VERSION.SDK_INT >= 35){

            WindowInsetsController windowInsetsController = getWindow().getDecorView().getWindowInsetsController();
            WindowInsetsControllerCompat controller = windowInsetsController != null
                    ? WindowInsetsControllerCompat.toWindowInsetsControllerCompat(
                    windowInsetsController) : null;

            if(controller != null){
                controller.setAppearanceLightStatusBars(true);
                controller.setAppearanceLightNavigationBars(true);
            }
        }


        //用来测试sdkDemo 胶囊×的点击事件，是否生效；lxl增加的
        DCUniMPSDK.getInstance().setCapsuleCloseButtonClickCallBack(new IDCUniMPOnCapsuleCloseButtontCallBack() {
            @Override
            public void closeButtonClicked(String appid) {
                Toast.makeText(mContext, "点击×号了", Toast.LENGTH_SHORT).show();
                if(mUniMPCaches.containsKey(appid)) {
                    IUniMP mIUniMP = mUniMPCaches.get(appid);
                    if (mIUniMP != null && mIUniMP.isRuning()){
                        mIUniMP.closeUniMP();
                        mUniMPCaches.remove(appid) ;
                    }
                }
            }
        });


        button1.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                try {
                    UniMPOpenConfiguration uniMPOpenConfiguration = new UniMPOpenConfiguration();
                    uniMPOpenConfiguration.splashClass = MySplashView.class;
                    uniMPOpenConfiguration.extraData.put("darkmode", "light");
                    IUniMP uniMP = DCUniMPSDK.getInstance().openUniMP(mContext, UNI_MP_APP_ID, uniMPOpenConfiguration);
                    mUniMPCaches.put(uniMP.getAppid(), uniMP);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });


        Button button2 = findViewById(R.id.button2);

        button2.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                try {
                    IUniMP uniMP = DCUniMPSDK.getInstance().openUniMP(mContext, UNI_MP_APP_ID);
                    mUniMPCaches.put(uniMP.getAppid(), uniMP);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });

        Button button3 = findViewById(R.id.button3);

        button3.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                try {
                    UniMPOpenConfiguration uniMPOpenConfiguration = new UniMPOpenConfiguration();
                    uniMPOpenConfiguration.path = "pages/rum/rum";
                    IUniMP uniMP = DCUniMPSDK.getInstance().openUniMP(mContext, UNI_MP_APP_ID, uniMPOpenConfiguration);
                    mUniMPCaches.put(uniMP.getAppid(), uniMP);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });

        Button button4 = findViewById(R.id.button4);

        button4.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                try {
                    UniMPOpenConfiguration uniMPOpenConfiguration = new UniMPOpenConfiguration();
                    uniMPOpenConfiguration.path = "pages/logging/logging";

                    final IUniMP uniMP = DCUniMPSDK.getInstance().openUniMP(mContext, UNI_MP_APP_ID, uniMPOpenConfiguration);
                    mUniMPCaches.put(uniMP.getAppid(), uniMP);
                    mHandler.postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            Log.e("unimp", "延迟5秒结束 开始关闭当前小程序");
                            uniMP.closeUniMP();
                        }
                    }, 5000);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });

        Button button5 = findViewById(R.id.button5);

        button5.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                JSONObject info = DCUniMPSDK.getInstance().getAppVersionInfo(UNI_MP_APP_ID);
                if(info != null) {
                    Log.e("unimp", "info==="+info.toString());
                }
            }
        });

        Button button6 = findViewById(R.id.button6);
            button6.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    try {
                        IUniMP uniMP = DCUniMPSDK.getInstance().openUniMP(mContext, UNI_MP_APP_ID);
                        mUniMPCaches.put(uniMP.getAppid(), uniMP);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });

        Button button7 = findViewById(R.id.button7);
        button7.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                try {
                    UniMPOpenConfiguration uniMPOpenConfiguration = new UniMPOpenConfiguration();
                    uniMPOpenConfiguration.redirectPath = "pages/tracing/tracing";

                    IUniMP uniMP = DCUniMPSDK.getInstance().openUniMP(mContext, UNI_MP_APP_ID, uniMPOpenConfiguration);
                    mUniMPCaches.put(uniMP.getAppid(), uniMP);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });

        Button button8 = findViewById(R.id.button8);
        button8.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    UniMPOpenConfiguration uniMPOpenConfiguration = new UniMPOpenConfiguration();
                    uniMPOpenConfiguration.redirectPath = "pages/logging/logging";
                    uniMPOpenConfiguration.extraData.put("darkmode", "dark");
                    IUniMP uniMP = DCUniMPSDK.getInstance().openUniMP(mContext, UNI_MP_APP_ID, uniMPOpenConfiguration);
                    mUniMPCaches.put(uniMP.getAppid(), uniMP);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });


        DCUniMPSDK.getInstance().setDefMenuButtonClickCallBack(new IMenuButtonClickCallBack() {
            @Override
            public void onClick(String appid, String id) {
                switch (id) {
                    case "gy":{
                        Log.e("unimp", "点击了关于" + appid);
                        //宿主主动触发事件
                        JSONObject data = new JSONObject();
                        try {
                            IUniMP uniMP = mUniMPCaches.get(appid);
                            if(uniMP != null) {
                                data.put("sj", "点击了关于");
                                uniMP.sendUniMPEvent("gy", data);
                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                        break;
                    }
                    case "hqdqym" :{
                        IUniMP uniMP = mUniMPCaches.get(appid);
                        if(uniMP != null) {
                            Log.e("unimp", "当前页面url=" + uniMP.getCurrentPageUrl());
                        } else {
                            Log.e("unimp", "未找到相关小程序实例");
                        }
                        break;
                    }
                    case "gotoTestPage" :
                        Intent intent = new Intent();
                        intent.setClassName(mContext, "com.example.unimpdemo.TestPageActivity");
                        DCUniMPSDK.getInstance().startActivityForUniMPTask(appid, intent);
                        break;
                }
            }
        });


        Button btn_encrypt_wgt_install = findViewById(R.id.btn_encrypt_wgt_install);
        btn_encrypt_wgt_install.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // 从 APK assets 释放并安装 WGT。
                updateWgt();
            }
        });

        DCUniMPSDK.getInstance().setOnUniMPEventCallBack(new IOnUniMPEventCallBack() {
            @Override
            public void onUniMPEventReceive(String appid, String event, Object data, DCUniMPJSCallback callback) {
                Log.i("cs", "onUniMPEventReceive    event="+event);
                //回传数据给小程序
                callback.invoke( "收到消息");
            }
        });

        checkPermission();
    }

    /**
     * 从 APK assets 安装并启动内置 WGT。
     */
    private void updateWgt() {
        final File wgtFile = new File(getCacheDir(), UNI_MP_WGT_FILE_NAME);
        try {
            copyAssetToFile(UNI_MP_WGT_ASSET_PATH, wgtFile);
        } catch (IOException e) {
            Log.e("unimp", "复制内置 WGT 失败", e);
            Toast.makeText(this, "复制内置 WGT 失败", Toast.LENGTH_SHORT).show();
            return;
        }

        UniMPReleaseConfiguration releaseConfiguration = new UniMPReleaseConfiguration();
        releaseConfiguration.wgtPath = wgtFile.getAbsolutePath();
        DCUniMPSDK.getInstance().releaseWgtToRunPath(UNI_MP_APP_ID, releaseConfiguration, new IUniMPReleaseCallBack() {
            @Override
            public void onCallBack(int code, Object pArgs) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (code == 1) {
                            try {
                                UniMPOpenConfiguration openConfiguration = new UniMPOpenConfiguration();
                                openConfiguration.extraData.put("darkmode", "auto");
                                IUniMP uniMP = DCUniMPSDK.getInstance().openUniMP(MainActivity.this, UNI_MP_APP_ID, openConfiguration);
                                mUniMPCaches.put(uniMP.getAppid(), uniMP);
                            } catch (Exception e) {
                                Log.e("unimp", "启动内置 WGT 失败", e);
                                Toast.makeText(MainActivity.this, "启动内置 WGT 失败", Toast.LENGTH_SHORT).show();
                            }
                        } else {
                            Log.e("unimp", "释放内置 WGT 失败: " + pArgs);
                            Toast.makeText(MainActivity.this, "安装内置 WGT 失败", Toast.LENGTH_SHORT).show();
                        }
                    }
                });
            }
        });
    }

    private void copyAssetToFile(String assetPath, File destination) throws IOException {
        try (InputStream inputStream = getAssets().open(assetPath);
             FileOutputStream outputStream = new FileOutputStream(destination)) {
            byte[] buffer = new byte[8 * 1024];
            int length;
            while ((length = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, length);
            }
        }
    }

    /**
     * 检查并申请权限
     */
    public void checkPermission() {
        int targetSdkVersion = 0;
        String[] PermissionString={Manifest.permission.WRITE_EXTERNAL_STORAGE};
        try {
            final PackageInfo info = this.getPackageManager().getPackageInfo(this.getPackageName(), 0);
            targetSdkVersion = info.applicationInfo.targetSdkVersion;//获取应用的Target版本
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            //Build.VERSION.SDK_INT是获取当前手机版本 Build.VERSION_CODES.M为6.0系统
            //如果系统>=6.0
            if (targetSdkVersion >= Build.VERSION_CODES.M) {
                //第 1 步: 检查是否有相应的权限
                boolean isAllGranted = checkPermissionAllGranted(PermissionString);
                if (isAllGranted) {
                    Log.e("err","所有权限已经授权！");
                    return;
                }
                // 一次请求多个权限, 如果其他有权限是已经授予的将会自动忽略掉
                ActivityCompat.requestPermissions(this, PermissionString, 1);
            }
        }
    }

    /**
     * 检查是否拥有指定的所有权限
     */
    private boolean checkPermissionAllGranted(String[] permissions) {
        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                // 只要有一个权限没有被授予, 则直接返回 false
                //Log.e("err","权限"+permission+"没有授权");
                return false;
            }
        }
        return true;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mUniMPCaches.clear();
    }
}
