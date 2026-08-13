import { UniEntryAbilityDev } from "@dcloudio/uni-app-runtime";
import { initUniModules } from "../uni_modules/index.generated";
import BuildProfile from "BuildProfile";
import * as hmr from '@uni_modules/hmr-for-uni-app'
import window from '@ohos.window';

initUniModules();

interface IHmr {
  init: Function
}

// 此处的字面量在应用到鸿蒙工程目录时会被替换为真正的 APPID
const UNI_APPID = "HBuilder";

export default class EntryAbility extends UniEntryAbilityDev {
  constructor() {
    super(UNI_APPID, {
      debug: BuildProfile.DEBUG,
    });
  }

  onWindowStageCreate(windowStage: window.WindowStage) {
    super.onWindowStageCreate(windowStage)
    hmr.init(UNI_APPID);
  }
}
