#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
    'src/compiler/compile.js',
    'src/compiler/index.js',
    'src/compiler/parser.jison',
    'src/compiler/pascal/program.js',
    'src/runtime/library.js',
    'src/runtime/commonMemory.js',
    'src/tex/changes/change-order',
    'vendor/texlive/texk/tex.web',
    'vendor/texlive/etexdir/etex.ch',
    'scripts/build/initex.js',
    'scripts/build/gzip-artifacts.mjs',
    'scripts/deploy/deploy-tikzjax-runtime.mjs',
    'site/mkdocs.yml'
];
let failed = false;
for (const relative of required) {
    if (!fs.existsSync(path.join(root, relative))) {
        console.error(`[web2js] Missing architecture path: ${relative}`);
        failed = true;
    }
}
for (const forbidden of [
    'compile.js',
    'index.js',
    'parser.jison',
    'library.js',
    'commonMemory.js',
    'initex.js',
    'deployWasmDump.js'
]) {
    if (fs.existsSync(path.join(root, forbidden))) {
        console.error(`[web2js] Legacy root file still present: ${forbidden}`);
        failed = true;
    }
}
if (failed) process.exit(1);
console.log('[web2js] Project architecture is consistent.');
