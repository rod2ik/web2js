#!/usr/bin/env node

import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const buildDir = path.join(projectRoot, 'build');
const result = spawnSync('tangle', ['-underline', 'tex.web'], { cwd: buildDir, stdio: 'inherit' });
if (result.error) {
    console.error(`[web2js] Could not execute tangle: ${result.error.message}`);
    process.exit(1);
}
process.exit(result.status ?? 1);
