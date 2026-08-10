const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sample = 'HybridHostExample-Harmony';

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertFile(relativePath) {
  assert(fs.existsSync(path.join(root, relativePath)), `${relativePath} must exist`);
}

for (const relativePath of [
  `${sample}/README.md`,
  `${sample}/uniapp/manifest.json`,
  `${sample}/uniapp/pages.json`,
  `${sample}/uniapp/sdk-bootstrap.js`,
  `${sample}/uniapp/pages/index/index.vue`,
  `${sample}/uniapp/harmony-configs/build-profile.json5`,
  `${sample}/uniapp/harmony-configs/AppScope/app.json5`,
  `${sample}/uniapp/uni_modules/GC-UniPlugin/utssdk/app-harmony/config.json`,
  `${sample}/scripts/bootstrap-host.mjs`,
  `${sample}/scripts/build-hap.sh`
]) {
  assertFile(relativePath);
}

const manifest = JSON.parse(read(`${sample}/uniapp/manifest.json`));
assert.strictEqual(manifest['app-harmony'].projectPath, '../host');
assert.strictEqual(manifest.vueVersion, '3');

const buildProfile = read(`${sample}/uniapp/harmony-configs/build-profile.json5`);
assert(buildProfile.includes('"compatibleSdkVersion": "6.0.2(22)"'));
assert(buildProfile.includes('"targetSdkVersion": "6.0.2(22)"'));
assert(buildProfile.includes('"useNormalizedOHMUrl": true'));

const dependencyConfig = JSON.parse(
  read(`${sample}/uniapp/uni_modules/GC-UniPlugin/utssdk/app-harmony/config.json`)
);
assert.deepStrictEqual(dependencyConfig.dependencies, {
  '@guancecloud/ft_sdk': '0.1.15',
  '@guancecloud/ft_sdk_ext': '0.1.15',
  '@guancecloud/ft_native': '0.1.1'
});
assert(!read(`${sample}/uniapp/uni_modules/GC-UniPlugin/utssdk/app-harmony/config.json`).includes('./libs/'));

const bootstrap = read(`${sample}/uniapp/sdk-bootstrap.js`);
for (const api of [
  'mobileAgent.sdkConfig',
  'rum.setConfig',
  'logger.setConfig',
  'tracer.setConfig',
  'gcErrorTracking.startTracking',
  'gcHarmonyNetworkTracking.startTracking'
]) {
  assert(bootstrap.includes(api), `${api} must be initialized by the Harmony host`);
}

const page = read(`${sample}/uniapp/pages/index/index.vue`);
for (const interaction of ['logger.logging', 'rum.addAction', 'rum.addError', 'gcRequest.request', 'mobileAgent.flushSyncData']) {
  assert(page.includes(interaction), `${interaction} must be exposed by the verification page`);
}
assert(page.includes('tag="gcwebview"'));
assert(page.includes('#ifdef APP-HARMONY'));

const setup = read(`${sample}/scripts/bootstrap-host.mjs`);
assert(setup.includes('entryability'));
assert(setup.includes("'tar'"));
assert(setup.includes("'harmony-configs'"));

const build = read(`${sample}/scripts/build-hap.sh`);
assert(build.includes('assembleHap'));
assert(build.includes('uni_modules/GC-UniPlugin'));
assert(build.includes('JAVA_HOME'));

for (const relativePath of [
  `${sample}/uniapp/uni_modules/GC-UniPlugin/package.json`,
  `${sample}/uniapp/uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts`,
  `${sample}/uniapp/uni_modules/GC-UniPlugin/utssdk/app-harmony/GCNativeWebView.ets`
]) {
  const absolutePath = path.join(root, relativePath);
  assert(fs.lstatSync(absolutePath).isSymbolicLink(), `${relativePath} must reuse the shared plugin source`);
  assert(fs.realpathSync(absolutePath).startsWith(path.join(root, 'Hbuilder_Example')));
}

console.log('Hybrid Harmony host integration checks passed');
