#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runtimeOnly = process.argv.includes('--runtime');
const docsOnly = process.argv.includes('--docs');

function resetDir(relativePath) {
    const dir = path.join(projectRoot, relativePath);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[web2js] Reset ${relativePath}/`);
}

if (!docsOnly) {
    resetDir('build');
    resetDir('dist');
}

if (!runtimeOnly) {
    fs.rmSync(path.join(projectRoot, 'public'), { recursive: true, force: true });
    console.log('[web2js] Removed public/');
}
