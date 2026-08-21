package com.ft.sdk.uniapp;

import static com.ft.sdk.FTApplication.getApplication;

import com.ft.sdk.FTActivityLifecycleCallbacks;
import com.ft.sdk.FTAutoTrack;
import com.ft.sdk.garble.utils.Utils;

/**
 * UniApp cannot use gradle plugin, so use this method instead
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

    long coldStartTimeLineNs = 0;
    long coldStartDurationNs = 0;

    void start() {
        if (!alreadyColdLaunch) {
            getApplication().registerActivityLifecycleCallbacks(lifecycleCallbacks);
            long appStartTimeNs = Utils.getAppStartTimeNs();
            long installTimeNs = System.nanoTime();
            coldStartDurationNs = Math.max(installTimeNs - appStartTimeNs, 0L);
            coldStartTimeLineNs = Utils.getCurrentNanoTime() - coldStartDurationNs;
            alreadyColdLaunch = true;
        }
    }

    void uploadColdBootTimeWhenManualStart() {
        if (coldStartTimeLineNs > 0) {
            FTAutoTrack.putRUMLaunchPerformance(
                    true, coldStartDurationNs, coldStartTimeLineNs);
            coldStartTimeLineNs = 0;
            coldStartDurationNs = 0;
        }
    }

    void reset() {
        getApplication().unregisterActivityLifecycleCallbacks(lifecycleCallbacks);
        alreadyColdLaunch = false;
        coldStartTimeLineNs = 0;
        coldStartDurationNs = 0;
    }


}
