import {
  isExistsUniMP,
  openUniMP,
  releaseWgtToRunPath,
} from '@dcloudio/uni-app-runtime';

const UNI_MP_ID = '__UNI__EDA429D';
const WGT_FILE_NAME = `${UNI_MP_ID}.wgt`;

@Entry
@Component
struct Index {
  @State status: string = '准备启动小程序';
  @State isLaunching: boolean = false;

  build() {
    Column({ space: 16 }) {
      Text(this.status)
        .fontSize(16);

      Button(this.isLaunching ? '正在启动…' : '打开 WGT 小程序')
        .enabled(!this.isLaunching)
        .onClick(async () => {
          await this.openWgtUniMP();
        });
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
  }

  private async openWgtUniMP(): Promise<void> {
    try {
      this.isLaunching = true;
      console.info(`WGT already released: ${isExistsUniMP(UNI_MP_ID)}`);

      this.status = '正在释放 WGT…';
      await this.releaseWgt();

      this.status = '正在打开小程序…';
      const mp = openUniMP(UNI_MP_ID);
      mp.on('show', () => {
        this.status = '小程序已打开';
      });
      mp.on('close', () => {
        this.status = '小程序已关闭';
      });
    } catch (error) {
      this.status = `启动失败：${String(error)}`;
      console.error(`Failed to open WGT: ${String(error)}`);
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
