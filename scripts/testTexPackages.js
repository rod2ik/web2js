#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const texPackagesDir = path.join(projectRoot, 'tex_packages');

function listTexPackageFiles() {
    if (!fs.existsSync(texPackagesDir)) {
        console.error(`Missing directory: ${texPackagesDir}`);
        process.exit(1);
    }

    return fs
        .readdirSync(texPackagesDir)
        .filter((file) => file.endsWith('.tex'))
        .sort()
        .map((file) => path.join('tex_packages', file));
}

const requestedPackages = process.argv.slice(2);

const texFiles =
    requestedPackages.length > 0
        ? requestedPackages.map((name) => {
              const filename = name.endsWith('.tex') ? name : `${name}.tex`;
              return path.join('tex_packages', filename);
          })
        : listTexPackageFiles();

let failed = false;

for (const texFile of texFiles) {
    const absoluteTexFile = path.join(projectRoot, texFile);

    if (!fs.existsSync(absoluteTexFile)) {
        console.error(`✗ Missing file: ${texFile}`);
        failed = true;
        continue;
    }

    console.log(`\n=== Testing ${texFile} ===`);

    const result = spawnSync('node', ['tex.js', texFile, 'y'], {
        cwd: projectRoot,
        encoding: 'utf8'
    });

    const logFile = absoluteTexFile.replace(/\.tex$/, '.output.log');
    fs.writeFileSync(logFile, result.stdout + result.stderr);

    if (result.status !== 0) {
        console.error(`✗ Failed: ${texFile}`);
        console.error(`  See log: ${path.relative(projectRoot, logFile)}`);
        failed = true;
        continue;
    }

    const jsonFile = absoluteTexFile.replace(/\.tex$/, '.json');
    const resolvedJsonFile = absoluteTexFile.replace(/\.tex$/, '.resolved.json');

    if (!fs.existsSync(jsonFile) || !fs.existsSync(resolvedJsonFile)) {
        console.error(`✗ TeX finished but JSON files were not created for ${texFile}`);
        console.error(`  See log: ${path.relative(projectRoot, logFile)}`);
        failed = true;
        continue;
    }

    console.log(`✓ OK: ${texFile}`);
    console.log(`  ${path.relative(projectRoot, jsonFile)}`);
    console.log(`  ${path.relative(projectRoot, resolvedJsonFile)}`);
    console.log(`  ${path.relative(projectRoot, logFile)}`);
}

process.exit(failed ? 1 : 0);