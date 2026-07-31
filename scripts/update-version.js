const fs = require('fs');
const path = require('path');

// Version file path
const versionFilePath = path.resolve(__dirname, '..', '.version');

// Path array for uni_modules package.json files
const packageJsonPaths = [
    path.resolve(__dirname, '../Hbuilder_Example/uni_modules/GC-UniPlugin', 'package.json'),
    path.resolve(__dirname, '../Hbuilder_Example/uni_modules/GC-UniSessionReplay', 'package.json')
];

const jsFilePaths = [
    path.resolve(__dirname, '../Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js'),
    path.resolve(__dirname, '../Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js'),
    path.resolve(__dirname, '../Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/Request/GCRequest.js')
];

const utsBridgeFilePath = path.resolve(__dirname, '../Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/bridge.uts');
const androidNativeFilePath = path.resolve(__dirname, '../Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-android/GCUniPluginNative.kt');

function updateJsVersionConstant(filePath, newVersion) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`JS file not found: ${filePath}`);
    }

    let fileContent = fs.readFileSync(filePath, 'utf8');

    const versionRegex = /const FT_JS_PLUGIN_VERSION = ['"](.*?)['"];/;

    if (!versionRegex.test(fileContent)) {
        console.warn(`Warning: FT_JS_PLUGIN_VERSION not found in ${filePath}, skip updating`);
        return;
    }

    fileContent = fileContent.replace(versionRegex, (match, oldVersion) => {
        const quote = match.includes("'") ? "'" : '"';
        return `const FT_JS_PLUGIN_VERSION = ${quote}${newVersion}${quote};`;
    });

    fs.writeFileSync(filePath, fileContent, 'utf8');
    console.log(`Updated FT_JS_PLUGIN_VERSION in ${filePath} to: ${newVersion}`);
}

function updateUtsBridgeVersion(filePath, newVersion) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`UTS bridge file not found: ${filePath}`);
    }

    let fileContent = fs.readFileSync(filePath, 'utf8');
    const versionRegex = /export const GC_UTS_BRIDGE_VERSION: string = ['"](.*?)['"]/;

    if (!versionRegex.test(fileContent)) {
        console.warn(`Warning: GC_UTS_BRIDGE_VERSION not found in ${filePath}, skip updating`);
        return;
    }

    fileContent = fileContent.replace(versionRegex, (match) => {
        const quote = match.includes("'") ? "'" : '"';
        return `export const GC_UTS_BRIDGE_VERSION: string = ${quote}${newVersion}${quote}`;
    });

    fs.writeFileSync(filePath, fileContent, 'utf8');
    console.log(`Updated GC_UTS_BRIDGE_VERSION in ${filePath} to: ${newVersion}`);
}

function updateAndroidBridgeInfoVersion(filePath, newVersion) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Android native file not found: ${filePath}`);
    }

    let fileContent = fs.readFileSync(filePath, 'utf8');
    const versionRegex = /put\("sdk_bridge_info", "\{\\?"uniapp\\?":\\?"[^"]+\\?"\}"\)/;

    if (!versionRegex.test(fileContent)) {
        console.warn(`Warning: Android uniapp bridge version not found in ${filePath}, skip updating`);
        return;
    }

    fileContent = fileContent.replace(versionRegex, `put("sdk_bridge_info", "{\\"uniapp\\":\\"${newVersion}\\"}")`);

    fs.writeFileSync(filePath, fileContent, 'utf8');
    console.log(`Updated Android bridge version in ${filePath} to: ${newVersion}`);
}

try {
    // Read content of .version file
    const versionFileContent = fs.readFileSync(versionFilePath, 'utf8').trim();

    // Parse version number
    const versionMatch = versionFileContent.match(/SDK_VERSION=(\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?)/);

    if (!versionMatch) {
        throw new Error('Invalid .version file format. It must contain SDK_VERSION=x.y.z or SDK_VERSION=x.y.z-suffix');
    }

    const newVersion = versionMatch[1];
    console.log(`Version number obtained from .version file: ${newVersion}`);

    // Loop to update each package.json
    packageJsonPaths.forEach(packageJsonPath => {
        // Check if file exists
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error(`File not found: ${packageJsonPath}`);
        }

        // Read and update version number
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        packageJson.version = newVersion;

        // Write back to file
        fs.writeFileSync(
            packageJsonPath,
            JSON.stringify(packageJson, null, 2) + '\n',
            'utf8'
        );

        console.log(`Updated version in ${packageJsonPath} to: ${newVersion}`);
    });

    jsFilePaths.forEach(jsFilePath => {
        updateJsVersionConstant(jsFilePath, newVersion);
    });

    updateUtsBridgeVersion(utsBridgeFilePath, newVersion);
    updateAndroidBridgeInfoVersion(androidNativeFilePath, newVersion);

} catch (err) {
    console.error('Failed to update version: ', err.message);
    process.exit(1);
}
