#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const buildDir = path.join(projectRoot, 'build');
const distDir = path.join(projectRoot, 'dist');
const artifacts = ['tex.wasm', 'core.dump'];

fs.mkdirSync(distDir, { recursive: true });

for (const name of artifacts) {
    const source = path.join(buildDir, name);
    const target = path.join(distDir, name);

    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
        console.error(`[web2js] Missing build artifact: build/${name}`);
        process.exit(1);
    }

    fs.copyFileSync(source, target);
    console.log(`[web2js] build/${name} -> dist/${name}`);
}
