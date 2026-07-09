#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const TARGET_TIKZJAX_DIR = '../tikzjax';

const FILES_TO_DEPLOY = [
    {
        source: 'tex.wasm',
        gzip: 'tex.wasm.gz'
    },
    {
        source: 'core.dump',
        gzip: 'core.dump.gz'
    }
];

const projectRoot = __dirname;
const tikzjaxRoot = path.resolve(projectRoot, TARGET_TIKZJAX_DIR);

function assertFileExists(filePath, label) {
    if (!fs.existsSync(filePath)) {
        console.error(`Missing ${label}: ${filePath}`);
        process.exit(1);
    }

    const stat = fs.statSync(filePath);

    if (!stat.isFile()) {
        console.error(`${label} is not a file: ${filePath}`);
        process.exit(1);
    }
}

function assertDirectoryExists(dirPath, label) {
    if (!fs.existsSync(dirPath)) {
        console.error(`Missing ${label}: ${dirPath}`);
        process.exit(1);
    }

    const stat = fs.statSync(dirPath);

    if (!stat.isDirectory()) {
        console.error(`${label} is not a directory: ${dirPath}`);
        process.exit(1);
    }
}

function formatBytes(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function gzipFile(sourcePath, gzipPath) {
    const input = fs.readFileSync(sourcePath);

    const output = zlib.gzipSync(input, {
        level: zlib.constants.Z_BEST_COMPRESSION
    });

    fs.writeFileSync(gzipPath, output);
}

assertDirectoryExists(tikzjaxRoot, 'TikZJax directory');

console.log('');
console.log('TikZJax WASM/dump deployment');
console.log('============================');
console.log(`Source: ${projectRoot}`);
console.log(`Target: ${tikzjaxRoot}`);
console.log('');

for (const file of FILES_TO_DEPLOY) {
    const sourcePath = path.join(projectRoot, file.source);
    const localGzipPath = path.join(projectRoot, file.gzip);

    const targetPath = path.join(tikzjaxRoot, file.source);
    const targetGzipPath = path.join(tikzjaxRoot, file.gzip);

    assertFileExists(sourcePath, file.source);

    gzipFile(sourcePath, localGzipPath);

    fs.copyFileSync(sourcePath, targetPath);
    fs.copyFileSync(localGzipPath, targetGzipPath);

    const sourceSize = fs.statSync(sourcePath).size;
    const gzipSize = fs.statSync(localGzipPath).size;

    console.log(`Copied ${file.source}`);
    console.log(`  ${path.relative(projectRoot, sourcePath)} -> ${path.relative(projectRoot, targetPath)}`);
    console.log(`  size: ${formatBytes(sourceSize)}`);

    console.log(`Created and copied ${file.gzip}`);
    console.log(`  ${path.relative(projectRoot, localGzipPath)} -> ${path.relative(projectRoot, targetGzipPath)}`);
    console.log(`  size: ${formatBytes(gzipSize)}`);
    console.log('');
}

console.log('Done.');
console.log('');
console.log('Next commands:');
console.log('  cd ../tikzjax');
console.log('  yarn build');
console.log('  yarn validate:dist');