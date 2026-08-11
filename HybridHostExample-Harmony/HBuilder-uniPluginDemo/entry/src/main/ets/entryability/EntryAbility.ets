import { UniEntryAbility } from "@dcloudio/uni-app-runtime";
import { initUniModules } from "../uni_modules/index.generated";
import BuildProfile from "BuildProfile";

initUniModules();

export default class EntryAbility extends UniEntryAbility {
  constructor() {
    super("HBuilder", {
      debug: BuildProfile.DEBUG,
    });
  }
}
