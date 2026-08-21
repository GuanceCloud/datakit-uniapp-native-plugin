const { checkVersionConsistency } = require('./update-version.js');

try {
    const version = checkVersionConsistency(process.argv[2]);
    console.log(`Release version is consistent: ${version}`);
} catch (error) {
    console.error(`Version consistency check failed: ${error.message}`);
    process.exit(1);
}
