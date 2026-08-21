#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const spawnSync = require('child_process').spawnSync;

const projectRoot = path.resolve(__dirname, '../..');
const outputDir = path.join(projectRoot, 'tex_packages');
const packagesFile = path.join(outputDir, 'texPackages.json');
const probesFile = path.join(outputDir, 'texPackages.probes.json');

const preservedFiles = new Set([
    'texPackages.json',
    'texPackages.probes.json'
]);

const removableExtensions = [
    '.resolved.json',
    '.output.log',
    '.tex',
    '.json'
];

function fail(message, error = null) {
    console.error(message);

    if (error) {
        console.error(error.message || error);
    }

    process.exit(1);
}

function readJsonFile(filePath, label) {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        fail(`Could not parse ${label}: ${filePath}`, error);
    }
}

function sanitizeFilename(name) {
    return String(name)
        .trim()
        .replace(/[^a-zA-Z0-9_.-]+/g, '-');
}

function escapeTexText(value) {
    return String(value)
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/([{}$&#_%])/g, '\\$1')
        .replace(/\^/g, '\\textasciicircum{}')
        .replace(/~/g, '\\textasciitilde{}');
}

function getStemFromGeneratedFile(filename) {
    for (const extension of removableExtensions) {
        if (filename.endsWith(extension)) {
            return filename.slice(0, -extension.length);
        }
    }

    return null;
}

function loadPackageList() {
    const packages = readJsonFile(packagesFile, 'package list');

    if (!packages) {
        fail(`Missing package list: ${packagesFile}`);
    }

    if (!Array.isArray(packages)) {
        fail(`Package list must be a JSON array: ${packagesFile}`);
    }

    const packageList = Array.from(
        new Set(
            packages
                .map((pkg) => String(pkg || '').trim())
                .filter(Boolean)
        )
    );

    if (packageList.length === 0) {
        fail(`Package list is empty: ${packagesFile}`);
    }

    return packageList;
}

function validatePackageFilenameCollisions(packageList) {
    const seen = new Map();

    for (const packageName of packageList) {
        const safeName = sanitizeFilename(packageName);

        if (!safeName) {
            fail(`Invalid package name in ${packagesFile}: ${JSON.stringify(packageName)}`);
        }

        if (seen.has(safeName) && seen.get(safeName) !== packageName) {
            fail(
                `Package filename collision: "${seen.get(safeName)}" and "${packageName}" both map to "${safeName}.tex"`
            );
        }

        seen.set(safeName, packageName);
    }
}

function loadProbeOverrides() {
    const overrides = readJsonFile(probesFile, 'probe overrides');

    if (!overrides) {
        return {};
    }

    if (typeof overrides !== 'object' || Array.isArray(overrides)) {
        fail(`Probe overrides must be a JSON object: ${probesFile}`);
    }

    return overrides;
}

function warnAboutUnusedProbeOverrides(packageList, probeOverrides) {
    const packageSet = new Set(packageList);

    for (const packageName of Object.keys(probeOverrides)) {
        if (!packageSet.has(packageName)) {
            console.warn(
                `Unused probe override: "${packageName}" is present in ${path.relative(projectRoot, probesFile)} ` +
                    `but not in ${path.relative(projectRoot, packagesFile)}`
            );
        }
    }
}

function cleanupStalePackageFiles(packageList) {
    const activeStems = new Set(
        packageList.map((packageName) => sanitizeFilename(packageName))
    );

    fs.mkdirSync(outputDir, { recursive: true });

    for (const file of fs.readdirSync(outputDir, { withFileTypes: true })) {
        if (!file.isFile()) {
            continue;
        }

        if (preservedFiles.has(file.name)) {
            continue;
        }

        const stem = getStemFromGeneratedFile(file.name);

        if (!stem) {
            continue;
        }

        if (activeStems.has(stem)) {
            continue;
        }

        const filePath = path.join(outputDir, file.name);

        fs.unlinkSync(filePath);

        console.log(`Removed stale package file: ${path.relative(projectRoot, filePath)}`);
    }
}

function normalizeProbeOverride(packageName, override) {
    if (!override) {
        return {};
    }

    if (typeof override === 'string') {
        return {
            body: override
        };
    }

    if (typeof override !== 'object' || Array.isArray(override)) {
        fail(`Invalid probe override for "${packageName}" in ${probesFile}`);
    }

    return override;
}

function defaultProbeBody(packageName) {
    return [
        '\\begin{tikzpicture}',
        `\\node at (0,0) {${escapeTexText(packageName)} loaded};`,
        '\\end{tikzpicture}'
    ].join('\n');
}

function buildProbeContent(packageName, rawOverride = {}) {
    const override = normalizeProbeOverride(packageName, rawOverride);

    const options = override.options || '';
    const preamble = override.preamble || '';
    const body = override.body || defaultProbeBody(packageName);

    const usePackageLine =
        '\\usepackage' +
        (options ? `[${options}]` : '') +
        `{${packageName}}`;

    return [
        '% This file was generated automatically by scripts/generate/gen-tikz-packages.js.',
        '% Edit tex_packages/texPackages.json or tex_packages/texPackages.probes.json instead.',
        `% Source package: ${packageName}`,
        '%\\documentclass[margin=0pt]{standalone}',
        '%\\usepackage{tikz}',
        usePackageLine,
        preamble,
        '',
        '\\begin{document}',
        body,
        '\\end{document}',
        ''
    ].join('\n');
}

function generateProbeFiles(packageList, probeOverrides) {
    fs.mkdirSync(outputDir, { recursive: true });

    const generatedTexFiles = [];

    for (const packageName of packageList) {
        const safeName = sanitizeFilename(packageName);
        const texFilePath = path.join(outputDir, `${safeName}.tex`);
        const override = probeOverrides[packageName] || {};
        const content = buildProbeContent(packageName, override);

        fs.writeFileSync(texFilePath, content);

        const relativeTexFile = path.join('tex_packages', `${safeName}.tex`);

        generatedTexFiles.push(relativeTexFile);

        console.log(`Generated probe: ${relativeTexFile}`);
    }

    return generatedTexFiles;
}

function runTeXProbe(texFile) {
    const result = spawnSync('node', ['scripts/runtime/run-tex.js', texFile, 'y'], {
        cwd: projectRoot,
        encoding: 'utf8'
    });

    const absoluteTexFile = path.join(projectRoot, texFile);
    const logFile = absoluteTexFile.replace(/\.tex$/, '.output.log');

    fs.writeFileSync(logFile, (result.stdout || '') + (result.stderr || ''));

    if (result.error) {
        console.error(`Could not run TeX probe for ${texFile}`);
        console.error(result.error.message);
        console.error(`TeX output saved to ${path.relative(projectRoot, logFile)}`);
        return false;
    }

    if (result.status !== 0) {
        console.error(`Failed while processing ${texFile}`);
        console.error(`TeX output saved to ${path.relative(projectRoot, logFile)}`);
        return false;
    }

    const jsonFile = absoluteTexFile.replace(/\.tex$/, '.json');
    const resolvedJsonFile = absoluteTexFile.replace(/\.tex$/, '.resolved.json');

    const missingOutputs = [];

    if (!fs.existsSync(jsonFile)) {
        missingOutputs.push(jsonFile);
    }

    if (!fs.existsSync(resolvedJsonFile)) {
        missingOutputs.push(resolvedJsonFile);
    }

    if (missingOutputs.length > 0) {
        console.error(`TeX finished, but expected output files were not created for ${texFile}`);

        for (const missingOutput of missingOutputs) {
            console.error(`Missing: ${path.relative(projectRoot, missingOutput)}`);
        }

        console.error(`TeX output saved to ${path.relative(projectRoot, logFile)}`);
        return false;
    }

    console.log(`Generated ${path.relative(projectRoot, jsonFile)}`);
    console.log(`Generated ${path.relative(projectRoot, resolvedJsonFile)}`);
    console.log(`TeX output saved to ${path.relative(projectRoot, logFile)}`);

    return true;
}

console.log('');
console.log('Generating TikZ/TeX package JSON files');
console.log('======================================');
console.log('');

fs.mkdirSync(outputDir, { recursive: true });

const packageList = loadPackageList();
const probeOverrides = loadProbeOverrides();

validatePackageFilenameCollisions(packageList);
warnAboutUnusedProbeOverrides(packageList, probeOverrides);
cleanupStalePackageFiles(packageList);

console.log(`Package list: ${path.relative(projectRoot, packagesFile)}`);
console.log(`Packages: ${packageList.length}`);

if (fs.existsSync(probesFile)) {
    console.log(`Probe overrides: ${path.relative(projectRoot, probesFile)}`);
} else {
    console.log('Probe overrides: none');
}

console.log('');

const texFiles = generateProbeFiles(packageList, probeOverrides);

let failed = false;

for (const texFile of texFiles) {
    console.log('');
    console.log(`Processing ${texFile}`);

    const ok = runTeXProbe(texFile);

    if (!ok) {
        failed = true;
    }
}

console.log('');

process.exit(failed ? 1 : 0);