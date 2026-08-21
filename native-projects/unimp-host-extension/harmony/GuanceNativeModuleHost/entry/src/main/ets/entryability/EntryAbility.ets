import { UIAbility } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { init } from '@dcloudio/uni-app-runtime';
import { initializeNativeSDK, registerNativeModules } from '@guancecloud/gc-uniplugin';
import { GUANCE_STARTUP_CONFIG } from '../config/GuanceStartupConfig';

export default class EntryAbility extends UIAbility {
  onCreate(): void {
    initializeNativeSDK(this.context, GUANCE_STARTUP_CONFIG);
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    init(this, windowStage, { debug: true });
    // registerModule writes to the Runtime's __NativeModule store.  The
    // Runtime must be initialized first, and this runs before any WGT opens.
    registerNativeModules(this.context);
    console.info('[UniMP Host] Native Module registration completed');

    windowStage.loadContent('pages/Index', (error) => {
      if (error.code) {
        console.error(`Failed to load host page: ${JSON.stringify(error)}`);
      }
    });
  }
}
