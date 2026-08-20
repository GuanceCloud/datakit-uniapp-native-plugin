const assert = require('assert');
const {
    assertValidVersion,
    checkVersionConsistency,
    normalizeVersion,
    readCanonicalVersion,
    versionTargets
} = require('./update-version.js');

const releaseVersion = readCanonicalVersion();

assert.doesNotThrow(() => assertValidVersion(releaseVersion));
for (const version of ['0.0.0', '1.2.3-rc.1+build.7']) {
    assert.doesNotThrow(() => assertValidVersion(version));
}
for (const version of ['', 'v1.2.3', '1.2', '01.2.3', '1.2.3-']) {
    assert.throws(() => assertValidVersion(version));
}

assert.strictEqual(normalizeVersion(`refs/tags/${releaseVersion}`), releaseVersion);
assert(versionTargets.some(target => target.path.endsWith('/package.json')));
assert(versionTargets.some(target => target.path.endsWith('/GC-JSPlugin/package.json')));
assert(versionTargets.some(target => target.path.endsWith('/bridge.uts')));
assert(versionTargets.some(target => target.path.endsWith('/index.kt')));
assert(versionTargets.some(target => target.path.endsWith('/index.swift')));
assert(versionTargets.some(target => target.path.endsWith('.podspec')));
assert(!versionTargets.some(target => target.path.endsWith('.js')));
assert.strictEqual(checkVersionConsistency(), releaseVersion);

console.log('version management checks passed');
