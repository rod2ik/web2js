#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distDir = path.join(projectRoot, 'dist');
const artifacts = ['tex.wasm', 'core.dump'];

for (const name of artifacts) {
    const source = path.join(distDir, name);
    const target = path.join(distDir, `${name}.gz`);

    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
        console.error(`[web2js] Missing dist artifact: dist/${name}`);
        process.exit(1);
    }

    const compressed = zlib.gzipSync(fs.readFileSync(source), {
        level: zlib.constants.Z_BEST_COMPRESSION
    });
    fs.writeFileSync(target, compressed);
    console.log(`[web2js] dist/${name} -> dist/${name}.gz`);
}
