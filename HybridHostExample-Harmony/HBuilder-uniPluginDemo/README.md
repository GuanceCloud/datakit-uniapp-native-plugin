# 将现有 UniApp 放入 HarmonyOS 原生工程

本工程用于把已编译的 UniApp 资源和 UTS 静态模块打入 HarmonyOS HAP。

## 1. 编译 UniApp

在 HBuilderX 打开 UniApp 源工程，执行 HarmonyOS 编译。编译产物目录为：

```text
<uniapp>/unpackage/dist/dev/.app-harmony/
```

## 2. 导入 UTS 静态模块

将编译产物中的入口文件复制到：

```text
源：.app-harmony/uni_modules/index.generated.ets
目标：entry/src/main/ets/uni_modules/index.generated.ets
```

将每个**支持 HarmonyOS** 的模块目录复制到：

```text
源：.app-harmony/uni_modules/<module>/
目标：uni_modules/<module>/
```

再将这些模块的依赖合并到根目录 `oh-package.json5`，并将模块项合并到
`build-profile.json5` 的 `modules` 数组。模块名称和路径以编译产物为准。

## 3. 导入 UniApp 资源

将 `.app-harmony` 中除 `uni_modules/` 外的全部内容复制到：

```text
entry/src/main/resources/resfile/apps/HBuilder/www/
```

复制后该目录应直接包含 `manifest.json`、`app-service.js`、页面文件和静态资源。
必须使用 `resfile`，不要改为 `rawfile`。

## 4. 同步并运行

1. 确认根目录 `oh-package.json5` 使用与当前 HBuilderX 编译器匹配的
   `@dcloudio/uni-app-runtime` 版本。
2. 在 DevEco Studio 打开本工程，执行 **Sync/OHPM Install**。
3. 配置本机签名，运行 `entry` 模块到设备或模拟器。

每次 UniApp 页面、资源或 UTS 模块变更后，重复上述导入步骤并重新构建 HAP。

官方文档：[将前端项目导入 HarmonyOS 原生工程](https://nativesupport.dcloud.net.cn/AppDocs/importfeproject/harmony.html)
