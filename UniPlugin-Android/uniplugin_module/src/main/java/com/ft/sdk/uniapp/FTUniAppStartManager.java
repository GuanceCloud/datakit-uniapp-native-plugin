package com.ft.sdk.uniapp;

import static com.ft.sdk.FTApplication.getApplication;

import android.os.Process;

import com.ft.sdk.FTActivityLifecycleCallbacks;
import com.ft.sdk.FTAutoTrack;
import com.ft.sdk.garble.utils.Utils;

import java.io.RandomAccessFile;

public class FTUniAppStartManager {
    private static class SingletonHolder {
        private static final FTUniAppStartManager INSTANCE = new FTUniAppStartManager();
    }

    public static FTUniAppStartManager get() {
        return FTUniAppStartManager.SingletonHolder.INSTANCE;
    }

    boolean alreadyColdLaunch = false;

    private final FTActivityLifecycleCallbacks lifecycleCallbacks = new FTActivityLifecycleCallbacks();

    long startTime = 0;
    long upTimesNano = 0;

    void start() {
        if (!alreadyColdLaunch) {
            getApplication().registerActivityLifecycleCallbacks(lifecycleCallbacks);
            startTime = Utils.getCurrentNanoTime();
            upTimesNano = getUpTimes() + System.nanoTime() % 1000000L;
            alreadyColdLaunch = true;
        }
    }

    void uploadColdBootTimeWhenManualStart() {
        if (startTime > 0) {
            FTAutoTrack.putRUMLaunchPerformance(true, upTimesNano, startTime - upTimesNano);
            startTime = 0;
            upTimesNano = 0;
        }
    }

    void reset() {
        getApplication().unregisterActivityLifecycleCallbacks(lifecycleCallbacks);
        alreadyColdLaunch = false;
        upTimesNano = 0;
        startTime = 0;
    }


    /**
     * 进程启动到当前间隔时间 {@link Process#getStartUptimeMillis();}
     *
     * @return
     */
    long getUpTimes() {
        long appTime = -1;
        try {
            RandomAccessFile appStatFile = new RandomAccessFile("/proc/"
                    + android.os.Process.myPid() + "/stat", "r");
            String appStatString = appStatFile.readLine();
            String[] appStats = appStatString.split(" ");
            appTime = Long.parseLong(appStats[19]);

        } catch (Exception e) {

        }
        return appTime;
    }


}
