#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const required = [
    ['node', ['--version']],
    ['tie', ['--help']],
    ['tangle', ['--help']],
    ['kpsewhich', ['--version']]
];
const optional = [
    ['fpc', ['-iV'], 'required by yarn test'],
    ['mkdocs', ['--version'], 'required by yarn dev / yarn build:docs']
];
let failed = false;

console.log('[web2js] Required build tools');
for (const [command, args] of required) {
    const result = spawnSync(command, args, { encoding: 'utf8' });
    if (result.error) {
        console.error(`  ✗ ${command}`);
        failed = true;
    } else {
        console.log(`  ✓ ${command}`);
    }
}

console.log('[web2js] Optional workflow tools');
for (const [command, args, reason] of optional) {
    const result = spawnSync(command, args, { encoding: 'utf8' });
    console.log(result.error ? `  - ${command} (${reason})` : `  ✓ ${command}`);
}

console.log('[web2js] wasm-opt is supplied by the Binaryen dependency and is resolved by Yarn during build:asyncify-wasm.');
if (failed) process.exit(1);
