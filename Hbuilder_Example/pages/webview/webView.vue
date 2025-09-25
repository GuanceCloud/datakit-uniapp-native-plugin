<template>
  <view class="container">
    <web-view :src="webviewUrl" @error="handleWebviewError"></web-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      webviewUrl: 'http://10.100.64.166/test/rum/'
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
</style>