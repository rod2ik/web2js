#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const changeOrder = path.join(projectRoot, 'src/tex/changes/change-order');
const changes = fs.readFileSync(changeOrder, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const args = ['-m', 'build/tex.web', 'vendor/texlive/texk/tex.web', ...changes];

fs.mkdirSync(path.join(projectRoot, 'build'), { recursive: true });
const result = spawnSync('tie', args, { cwd: projectRoot, stdio: 'inherit' });
if (result.error) {
    console.error(`[web2js] Could not execute tie: ${result.error.message}`);
    process.exit(1);
}
process.exit(result.status ?? 1);
