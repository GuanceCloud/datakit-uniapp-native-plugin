const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertIncludes(source, value, label) {
  assert(source.includes(value), `${label} must include ${JSON.stringify(value)}`);
}

function assertNotIncludes(source, value, label) {
  assert(!source.includes(value), `${label} must not include ${JSON.stringify(value)}`);
}

const feature = read('docs/features/tagged-hybrid-release-automation.md');
const pipeline = read('Jenkinsfile');
const publisher = read('scripts/publish_github_release.sh');
const releasePackager = read('scripts/package_guance_uniapp_release.sh');
const iOSPackage = read('native-projects/native-sdk-hybrid/ios/HBuilder-uniPluginDemo/scripts/package_guance_uniapp_ios.sh');
const iOSGenerator = read('native-projects/native-sdk-hybrid/ios/HBuilder-uniPluginDemo/scripts/generate_guance_uts_frameworks.rb');
const androidPackage = read('native-projects/native-sdk-hybrid/android/scripts/package_guance_uniapp_android.sh');
const githubWorkflow = read('.github/workflows/publish-uniapp-native-hybrid-release.yml');
const versionUpdater = read('scripts/update-version.js');
const versionChecker = read('scripts/check-version-consistency.js');

assertIncludes(feature, 'GitHub Release', 'feature note');
assertIncludes(pipeline, "label 'macos'", 'Jenkins pipeline');
assertIncludes(pipeline, 'env.TAG_NAME', 'Jenkins pipeline');
assertIncludes(pipeline, 'check-version-consistency.js "$tag"', 'Jenkins pipeline');
assertIncludes(pipeline, 'DCLOUD_UTS_RUNTIME_VERSION', 'Jenkins pipeline');
assertIncludes(pipeline, 'GC_UNIAPP_USE_CHECKED_IN_UTS_SOURCES=1', 'Jenkins pipeline');
assertIncludes(pipeline, 'package_guance_uniapp_android.sh', 'Jenkins pipeline');
assertIncludes(pipeline, 'package_guance_uniapp_ios.sh', 'Jenkins pipeline');
assertIncludes(pipeline, 'native-projects/native-sdk-hybrid/android', 'Jenkins Android workspace');
assertIncludes(pipeline, 'native-projects/native-sdk-hybrid/ios', 'Jenkins iOS workspace');
assertIncludes(pipeline, 'package_guance_uniapp_release.sh', 'Jenkins pipeline');
assertIncludes(pipeline, 'GuanceUniApp-$TAG_NAME.zip', 'Jenkins pipeline');
assertIncludes(pipeline, 'publish_github_release.sh', 'Jenkins pipeline');
assertIncludes(pipeline, "credentialsId: 'github-release-token'", 'Jenkins pipeline');
assertIncludes(publisher, 'gh release create', 'GitHub publisher');
assertIncludes(publisher, '--verify-tag', 'GitHub publisher');
assertIncludes(publisher, '--prerelease', 'GitHub publisher');
assertIncludes(publisher, 'gh release upload', 'GitHub publisher');
assertIncludes(publisher, '--clobber', 'GitHub publisher');
assertNotIncludes(publisher, 'gh auth login', 'GitHub publisher');
assertIncludes(iOSPackage, 'GC_UNIAPP_USE_CHECKED_IN_UTS_SOURCES', 'iOS package script');
assertIncludes(iOSGenerator, 'GC_UNIAPP_USE_CHECKED_IN_UTS_SOURCES', 'iOS UTS generator');
assertIncludes(iOSGenerator, 'checked_in_generated_index', 'iOS UTS generator');
assertIncludes(androidPackage, 'DCLOUD_UTS_RUNTIME_VERSION', 'Android package script');
assertIncludes(androidPackage, ':unimoduleGCUniPlugin:assembleRelease', 'Android package script');
assertIncludes(androidPackage, '--project-dir', 'Android package script');
assertIncludes(androidPackage, 'unimoduleGCUniPlugin.aar', 'Android package script');
assertIncludes(androidPackage, 'unzip -tqq', 'Android package script');
assertNotIncludes(androidPackage, 'unimoduleGCUniPlugin.jar', 'Android package script');
assertIncludes(releasePackager, 'GuanceUniApp-iOS-$version', 'combined release packager');
assertIncludes(releasePackager, 'GuanceUniApp-Android-$version', 'combined release packager');
assertIncludes(releasePackager, '"platforms": ["iOS", "Android"]', 'combined release packager');
assertNotIncludes(pipeline, 'ghp_', 'Jenkins pipeline');
assertNotIncludes(publisher, 'ghp_', 'GitHub publisher');
assertIncludes(githubWorkflow, 'push:', 'GitHub release workflow');
assertIncludes(githubWorkflow, 'tags:', 'GitHub release workflow');
assertIncludes(githubWorkflow, 'workflow_dispatch:', 'GitHub release workflow');
assertIncludes(githubWorkflow, 'runs-on: [self-hosted, macos]', 'GitHub release workflow');
assertIncludes(githubWorkflow, 'DCLOUD_SDK_LIBS_DIR: ${{ vars.DCLOUD_SDK_LIBS_DIR }}', 'GitHub release workflow');
assertIncludes(githubWorkflow, 'GC_UNIAPP_USE_CHECKED_IN_UTS_SOURCES=1', 'GitHub release workflow');
assertIncludes(githubWorkflow, 'native-projects/native-sdk-hybrid/android', 'GitHub Android workspace');
assertIncludes(githubWorkflow, 'native-projects/native-sdk-hybrid/ios', 'GitHub iOS workspace');
assertIncludes(githubWorkflow, 'actions/upload-artifact@v4', 'GitHub release workflow');
assertIncludes(githubWorkflow, 'publish_github_release.sh', 'GitHub release workflow');
assertIncludes(githubWorkflow, 'check-version-consistency.js "$tag_name"', 'GitHub release workflow');
assertNotIncludes(githubWorkflow, 'ghp_', 'GitHub release workflow');
assertIncludes(versionUpdater, "path.join(root, '.version')", 'version updater');
assertIncludes(versionUpdater, 'checked-in generated source', 'version updater');
assertIncludes(versionChecker, 'checkVersionConsistency', 'version checker');

console.log('tagged release automation checks passed');
