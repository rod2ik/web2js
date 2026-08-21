#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const output = path.resolve(root, '..', `${pkg.name}-${pkg.version}-project.zip`);
const listed = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8'
});
if (listed.status !== 0) {
    console.error(listed.stderr || '[web2js] git ls-files failed.');
    process.exit(listed.status || 1);
}
const files = listed.stdout.split(/\r?\n/).filter(Boolean);

// core.dump is intentionally ignored by Git because it exceeds GitHub's
// regular 100 MiB object limit, but a local/release project ZIP should still
// contain all four runtime artifacts when the raw dump is available.
const ignoredRuntimeArtifacts = ['dist/core.dump'];
for (const relativePath of ignoredRuntimeArtifacts) {
    const absolutePath = path.join(root, relativePath);
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile() && !files.includes(relativePath)) {
        files.push(relativePath);
    }
}

if (files.length === 0) {
    console.error('[web2js] No files selected for the project archive.');
    process.exit(1);
}
fs.rmSync(output, { force: true });
const zip = spawnSync('zip', ['-9', '-q', '-y', output, '-@'], {
    cwd: root,
    input: `${files.join('\n')}\n`,
    encoding: 'utf8'
});
if (zip.status !== 0) {
    console.error(zip.stderr || '[web2js] zip failed.');
    process.exit(zip.status || 1);
}
console.log(`[web2js] Created ${output}`);
