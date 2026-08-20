import {
  isExistsUniMP,
  openUniMP,
  releaseWgtToRunPath,
} from '@dcloudio/uni-app-runtime';
import { registerNativeModules } from '@guancecloud/gc-uniplugin';

const UNI_MP_ID = '__UNI__EDA429D';
const WGT_FILE_NAME = `${UNI_MP_ID}.wgt`;

@Entry
@Component
struct Index {
  @State status: string = '准备启动最小 UniMP';
  @State isLaunching: boolean = false;

  build() {
    Column({ space: 16 }) {
      Text(this.status)
        .fontSize(16);

      Button(this.isLaunching ? '正在启动…' : '打开 UniMP')
        .enabled(!this.isLaunching)
        .onClick(async () => {
          await this.openWgtUniMP();
        });
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center);
  }

  private async openWgtUniMP(): Promise<void> {
    try {
      this.isLaunching = true;
      // Idempotent: guarantees the Module is present immediately before the
      // Ensure GCUniPlugin modules are available before the WGT starts.
      registerNativeModules();
      console.info('[UniMP Host] Native Modules ready; opening WGT');
      console.info(`WGT already released: ${isExistsUniMP(UNI_MP_ID)}`);

      this.status = '正在释放 WGT…';
      await this.releaseWgt();

      this.status = '正在打开 UniMP…';
      const mp = openUniMP(UNI_MP_ID);
      mp.on('show', () => {
        this.status = 'UniMP 已打开，可调用 GCUniPlugin 原生模块';
      });
      mp.on('close', () => {
        this.status = 'UniMP 已关闭';
      });
    } catch (error) {
      this.status = `启动失败：${String(error)}`;
      console.error(`Failed to open UniMP: ${String(error)}`);
    } finally {
      this.isLaunching = false;
    }
  }

  private releaseWgt(): Promise<void> {
    const wgtPath = `${getContext().resourceDir}/${WGT_FILE_NAME}`;

    return new Promise((resolve, reject) => {
      releaseWgtToRunPath(UNI_MP_ID, wgtPath, (code, error) => {
        if (code === 1) {
          resolve();
          return;
        }
        reject(error ?? new Error('WGT release failed'));
      });
    });
  }
}
