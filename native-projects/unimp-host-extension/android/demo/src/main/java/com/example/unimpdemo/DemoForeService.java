package com.example.unimpdemo;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Binder;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;


public class DemoForeService extends Service {


    public DemoForeService() {

    }


    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        // 点击后让通知将消失
        NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(getApplicationContext(),"demo").setAutoCancel(true);
        mBuilder.setContentText("测试");
        mBuilder.setContentTitle("测试");
        mBuilder.setSmallIcon(R.mipmap.icon);
        mBuilder.setWhen(System.currentTimeMillis());
        mBuilder.setPriority(Notification.PRIORITY_DEFAULT);
        mBuilder.setOngoing(true);
        mBuilder.setDefaults(Notification.DEFAULT_ALL);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            String channelId = "channelId" + System.currentTimeMillis();
            NotificationChannel channel = new NotificationChannel(channelId, getResources().getString(R.string.app_name), NotificationManager.IMPORTANCE_HIGH);
            manager.createNotificationChannel(channel);
            mBuilder.setChannelId(channelId);
        }
        mBuilder.setContentIntent(null);
        startForeground(1024, mBuilder.build());

        return super.onStartCommand(intent, flags, startId);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopForeground(true);// 停止前台服务--参数：表示是否移除之前的通知
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }


}
