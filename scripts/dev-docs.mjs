#!/usr/bin/env node

import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteDir = path.join(projectRoot, 'site');
const host = process.env.WEB2JS_DEV_HOST || '127.0.0.1';
const port = process.env.WEB2JS_DEV_PORT || '8000';
const child = spawn('mkdocs', ['serve', '--dev-addr', `${host}:${port}`], {
    cwd: siteDir,
    stdio: 'inherit'
});

child.on('error', (error) => {
    console.error(`[web2js] Could not start MkDocs: ${error.message}`);
    process.exit(1);
});
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
