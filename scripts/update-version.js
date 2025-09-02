const fs = require('fs');
const path = require('path');

// Version file path
const versionFilePath = path.resolve(__dirname, '..', '.version');

// Path array for the two package.json files
const packageJsonPaths = [
    path.resolve(__dirname, '../Hbuilder_Example/uni_modules/GC-JSPlugin', 'package.json'),
    path.resolve(__dirname, '../Hbuilder_Example/nativeplugins/GCUniPlugin', 'package.json')
];

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

} catch (err) {
    console.error('Failed to update version: ', err.message);
    process.exit(1);
}