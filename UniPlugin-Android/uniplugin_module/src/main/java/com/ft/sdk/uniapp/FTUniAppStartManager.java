package com.ft.sdk.uniapp;

import static com.ft.sdk.FTApplication.getApplication;

import com.ft.sdk.FTActivityLifecycleCallbacks;
import com.ft.sdk.FTAutoTrack;
import com.ft.sdk.garble.utils.Utils;

/**
 * UniApp 无法使用 gradle plugin，所以使用这种方式进
 */
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
    long installTime = 0;

    void start() {
        if (!alreadyColdLaunch) {
            getApplication().registerActivityLifecycleCallbacks(lifecycleCallbacks);
            startTime = Utils.getAppStartTimeNs();
            installTime = Utils.getCurrentNanoTime();
            alreadyColdLaunch = true;
        }
    }

    void uploadColdBootTimeWhenManualStart() {
        if (startTime > 0) {
            FTAutoTrack.putRUMLaunchPerformance(true, startTime - installTime, startTime);
            startTime = 0;
            installTime = 0;
        }
    }

    void reset() {
        getApplication().unregisterActivityLifecycleCallbacks(lifecycleCallbacks);
        alreadyColdLaunch = false;
        startTime = 0;
        installTime = 0;
    }


}
