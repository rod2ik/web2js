#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distDir = path.join(projectRoot, 'dist');
const tikzjaxRoot = path.resolve(projectRoot, '../tikzjax');
const artifacts = ['tex.wasm', 'tex.wasm.gz', 'core.dump', 'core.dump.gz'];

if (!fs.existsSync(tikzjaxRoot) || !fs.statSync(tikzjaxRoot).isDirectory()) {
    console.error(`[web2js] Missing sibling TikZJax directory: ${tikzjaxRoot}`);
    process.exit(1);
}

console.log('[web2js] Deploying runtime artifacts to ../tikzjax');
for (const name of artifacts) {
    const source = path.join(distDir, name);
    const target = path.join(tikzjaxRoot, name);
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
        console.error(`[web2js] Missing dist artifact: dist/${name}`);
        process.exit(1);
    }
    fs.copyFileSync(source, target);
    console.log(`  dist/${name} -> ../tikzjax/${name}`);
}
console.log('[web2js] Runtime deployment complete.');
