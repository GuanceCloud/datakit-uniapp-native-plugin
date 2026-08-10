#!/usr/bin/env node

import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const sampleRoot = resolve(dirname(new URL(import.meta.url).pathname), '..');
const defaultDestination = resolve(sampleRoot, 'host');

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(
    'Usage: node scripts/bootstrap-host.mjs --template <template-directory-or-tgz> [--destination <directory>] [--force]'
  );
  process.exit(1);
}

const args = process.argv.slice(2);
let templatePath = '';
let destination = defaultDestination;
let force = false;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--template') {
    templatePath = args[++index] || '';
  } else if (arg === '--destination') {
    destination = resolve(args[++index] || '');
  } else if (arg === '--force') {
    force = true;
  } else {
    usage(`Unknown option: ${arg}`);
  }
}

if (!templatePath) usage('A DCloud Harmony offline SDK template is required.');

const resolvedTemplate = resolve(templatePath);
if (!existsSync(resolvedTemplate)) usage(`Template does not exist: ${resolvedTemplate}`);

if (existsSync(destination)) {
  if (!force) {
    usage(`Destination already exists: ${destination}. Re-run with --force only after backing it up.`);
  }
  rmSync(destination, { recursive: true, force: true });
}

let source = resolvedTemplate;
let temporaryDirectory = '';
if (/\.(tgz|tar\.gz)$/i.test(basename(resolvedTemplate))) {
  temporaryDirectory = mkdtempSync(resolve(tmpdir(), 'guance-harmony-template-'));
  const extracted = spawnSync('tar', ['-xzf', resolvedTemplate, '-C', temporaryDirectory], {
    stdio: 'inherit'
  });
  if (extracted.status !== 0) process.exit(extracted.status || 1);
  source = resolve(temporaryDirectory, 'package');
}

if (!existsSync(resolve(source, 'entry', 'src', 'main', 'ets', 'entryability', 'EntryAbility.ets'))) {
  usage('The template must be the DCloud Harmony offline SDK package directory (or its .tgz archive).');
}

cpSync(source, destination, { recursive: true });

// The Guance Harmony packages pinned by this sample require API 22. Keep the
// app identity and product baseline in the UniApp project so they are
// credential-free and can be copied into every freshly downloaded template.
const harmonyConfigRoot = resolve(sampleRoot, 'uniapp', 'harmony-configs');
cpSync(resolve(harmonyConfigRoot, 'build-profile.json5'), resolve(destination, 'build-profile.json5'));
cpSync(resolve(harmonyConfigRoot, 'AppScope', 'app.json5'), resolve(destination, 'AppScope', 'app.json5'));

if (temporaryDirectory) {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log(`DCloud Harmony offline host created at: ${destination}`);
console.log('Next: open ../uniapp in HBuilderX, run it to Harmony DevEco Studio, then configure signing in DevEco.');
