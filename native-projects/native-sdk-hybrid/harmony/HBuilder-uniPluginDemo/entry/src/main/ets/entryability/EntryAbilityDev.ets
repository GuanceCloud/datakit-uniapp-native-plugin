import { UIAbility } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { init } from '@dcloudio/uni-app-runtime';
import { initUniModules } from '../uni_modules/index.generated';
import BuildProfile from 'BuildProfile';

initUniModules();

export default class EntryAbility extends UIAbility {
  onWindowStageCreate(windowStage: window.WindowStage): void {
    init(this, windowStage, {
      debug: BuildProfile.DEBUG,
    });

    windowStage.loadContent('pages/Index', (error) => {
      if (error.code) {
        console.error(`Failed to load WGT launcher: ${JSON.stringify(error)}`);
      }
    });
  }
}
