#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distDir = path.join(projectRoot, 'dist');
const baseArtifacts = ['tex.wasm', 'core.dump'];
let failed = false;

for (const name of baseArtifacts) {
    const rawPath = path.join(distDir, name);
    const gzipPath = `${rawPath}.gz`;

    for (const file of [rawPath, gzipPath]) {
        if (!fs.existsSync(file) || !fs.statSync(file).isFile() || fs.statSync(file).size === 0) {
            console.error(`[web2js] Invalid or missing artifact: ${path.relative(projectRoot, file)}`);
            failed = true;
        }
    }

    if (failed || !fs.existsSync(rawPath) || !fs.existsSync(gzipPath)) continue;

    const raw = fs.readFileSync(rawPath);
    let unpacked;
    try {
        unpacked = zlib.gunzipSync(fs.readFileSync(gzipPath));
    } catch (error) {
        console.error(`[web2js] Could not gunzip dist/${name}.gz: ${error.message}`);
        failed = true;
        continue;
    }

    if (!raw.equals(unpacked)) {
        console.error(`[web2js] dist/${name}.gz does not expand to dist/${name}`);
        failed = true;
    } else {
        console.log(`[web2js] OK dist/${name} <-> dist/${name}.gz`);
    }
}

if (failed) process.exit(1);
console.log('[web2js] dist/ contains the four valid TikZJax runtime artifacts.');
