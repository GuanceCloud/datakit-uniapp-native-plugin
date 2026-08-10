<template>
  <view class="page">
    <view class="hero">
      <text class="title">Guance Harmony Hybrid Host</text>
      <text class="subtitle">OHPM SDK + UTS bridge integration verification</text>
    </view>

    <view class="card">
      <text class="label">SDK configuration</text>
      <text :class="configured ? 'ok' : 'warning'">{{ configurationMessage }}</text>
    </view>

    <view class="card">
      <text class="label">Telemetry verification</text>
      <button type="primary" @click="sendLog">Send Log</button>
      <button @click="sendAction">Send RUM Action</button>
      <button @click="sendError">Send RUM Error</button>
      <button @click="sendRequest">Run uni.request</button>
      <button @click="flush">Flush Buffered Data</button>
    </view>

    <view class="card webview-card">
      <text class="label">WebView RUM verification</text>
      <!-- #ifdef APP-HARMONY -->
      <embed class="webview" tag="gcwebview" :options="webviewOptions"></embed>
      <!-- #endif -->
      <!-- #ifndef APP-HARMONY -->
      <text class="warning">This native WebView bridge is available only in Harmony builds.</text>
      <!-- #endif -->
    </view>
  </view>
</template>

<script>
import {
  logger,
  mobileAgent,
  rum
} from '@/uni_modules/GC-UniPlugin';
import { gcRequest } from '@/uni_modules/GC-UniPlugin/js_sdk';
import { guanceConfig } from '../../guance-config.js';
import { isGuanceConfigured } from '../../sdk-bootstrap.js';

export default {
  data() {
    return {
      configured: isGuanceConfigured(),
      webviewOptions: {
        src: guanceConfig.webViewUrl,
        viewName: 'guance-harmony-host-webview'
      }
    };
  },
  computed: {
    configurationMessage() {
      return this.configured
        ? 'Configured — telemetry is sent to the configured Guance workspace.'
        : 'Not configured — edit guance-config.js, then rebuild the HAP.';
    }
  },
  methods: {
    ensureConfigured() {
      if (this.configured) {
        return true;
      }
      uni.showToast({
        title: 'Configure Guance credentials first',
        icon: 'none'
      });
      return false;
    },
    sendLog() {
      if (!this.ensureConfigured()) return;
      logger.logging({
        content: 'Harmony hybrid host log verification',
        status: 'info',
        property: { source: 'demo-button' }
      });
      uni.showToast({ title: 'Log sent', icon: 'success' });
    },
    sendAction() {
      if (!this.ensureConfigured()) return;
      rum.addAction({
        actionName: 'verify_harmony_hybrid_action',
        actionType: 'click',
        property: { source: 'demo-button' }
      });
      uni.showToast({ title: 'Action sent', icon: 'success' });
    },
    sendError() {
      if (!this.ensureConfigured()) return;
      rum.addError({
        message: 'Harmony hybrid host verification error',
        stack: 'GuanceHarmonyHostVerificationError',
        type: 'demo_error',
        property: { source: 'demo-button' }
      });
      uni.showToast({ title: 'Error sent', icon: 'success' });
    },
    sendRequest() {
      if (!this.ensureConfigured()) return;
      gcRequest.request({
        url: guanceConfig.requestUrl,
        method: 'GET',
        complete: () => {
          uni.showToast({ title: 'Request complete', icon: 'none' });
        }
      });
    },
    flush() {
      if (!this.ensureConfigured()) return;
      mobileAgent.flushSyncData();
      uni.showToast({ title: 'Flush requested', icon: 'success' });
    }
  }
};
</script>

<style>
.page {
  min-height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
}

.hero,
.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.title,
.subtitle,
.label,
.ok,
.warning {
  display: block;
}

.title {
  color: #1f2937;
  font-size: 40rpx;
  font-weight: 600;
}

.subtitle {
  margin-top: 12rpx;
  color: #6b7280;
  font-size: 26rpx;
}

.label {
  margin-bottom: 20rpx;
  color: #374151;
  font-size: 30rpx;
  font-weight: 600;
}

.ok {
  color: #059669;
}

.warning {
  color: #b45309;
}

button {
  margin-bottom: 16rpx;
}

.webview-card {
  height: 700rpx;
}

.webview {
  display: block;
  width: 100%;
  height: 620rpx;
}
</style>
