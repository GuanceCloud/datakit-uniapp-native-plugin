<template>
  <view class="container">
    <!-- #ifdef APP-HARMONY -->
    <embed
      class="harmony-webview"
      tag="gcwebview"
      :options="harmonyWebviewOptions"
    ></embed>
    <!-- #endif -->
    <!-- #ifndef APP-HARMONY -->
    <web-view
      :src="webviewUrl"
      @error="handleWebviewError"
    ></web-view>
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  data() {
    return {
      webviewUrl: 'http://10.100.64.166/test/rum/',
      harmonyWebviewOptions: {
        src: 'http://10.100.64.166/test/rum/',
        viewName: 'webview',
        // Demo-only: verifies that a pre-existing bridge remains available
        // after FTWebViewHandler registers the RUM bridge.
        enableBridgeCompatibilityCheck: true
      }
    };
  },
  methods: {
    handleWebviewError(err) {
      uni.showToast({
        title: 'The page failed to load. Please check the URL or try again later.',
        icon: 'none',
        duration: 3000
      });
    }
  }
};
</script>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
}
web-view {
  width: 100%;
  height: 100%;
}
.harmony-webview {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
