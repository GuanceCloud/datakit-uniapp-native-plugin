const fs = require('fs');
const path = require('path');

// Path to the .version file in the parent directory
const versionFilePath = path.resolve(__dirname, '../..', '.version');
// Path to the package.json of the current package
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');

try {
    // Read the content of the .version file
    const versionFileContent = fs.readFileSync(versionFilePath, 'utf8').trim();

    // Parse the version number (supports formats with suffixes, e.g., 0.2.4-alpha.3, 1.0.0-beta.2)
    // Regex explanation:
    // \d+\.\d+\.\d+ matches the main version number (x.y.z)
    // (-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)? matches the optional suffix (e.g., -alpha.3)
    const versionMatch = versionFileContent.match(/SDK_VERSION=(\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?)/);

    if (!versionMatch) {
        throw new Error('Invalid .version file format. It must contain SDK_VERSION=x.y.z or SDK_VERSION=x.y.z-suffix');
    }

    const newVersion = versionMatch[1];
    console.log(`Version number obtained from .version file: ${newVersion}`);

    // Read package.json and update the version number
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = newVersion;

    // Write back to package.json
    fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + '\n',
        'utf8'
    );

    console.log(`package.json version has been updated to: ${newVersion}`);
} catch (err) {
    console.error('Failed to update version: ', err.message);
    process.exit(1);
}