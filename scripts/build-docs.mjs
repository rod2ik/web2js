#!/usr/bin/env node

import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync('mkdocs', ['build', '--clean', '--strict'], {
    cwd: path.join(projectRoot, 'site'),
    stdio: 'inherit'
});
if (result.error) {
    console.error(`[web2js] Could not build MkDocs documentation: ${result.error.message}`);
    process.exit(1);
}
process.exit(result.status ?? 1);
