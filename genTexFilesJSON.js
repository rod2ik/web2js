#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;

const INPUT_DIRS = [
    {
        label: 'TikZ libraries',
        dir: path.join(projectRoot, 'tikz_libs')
    },
    {
        label: 'TeX packages',
        dir: path.join(projectRoot, 'tex_packages')
    }
];

const OUTPUT_FILE = path.join(projectRoot, 'tex_files.generated.json');

const ignoredFilePatterns = [
    /\.aux$/,
    /\.log$/,
    /\.dvi$/,
    /\.pdf$/,
    /\.svg$/,
    /\.output\.log$/,
    /\.resolved\.json$/,
    /^texPackages\.json$/,
    /^texPackages\.probes\.json$/,
    /^stdin$/,
    /^stdout$/
];

function shouldIgnoreFile(filename) {
    return ignoredFilePatterns.some((pattern) => pattern.test(filename));
}

function readJsonFile(filePath) {
    const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (Array.isArray(value)) {
        return value;
    }

    if (value && typeof value === 'object') {
        return Object.keys(value);
    }

    throw new Error(`Unsupported JSON format in ${filePath}`);
}

function collectJsonFiles(dir) {
    if (!fs.existsSync(dir)) {
        console.warn(`Skipping missing directory: ${path.relative(projectRoot, dir)}`);
        return [];
    }

    return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((file) => file.isFile())
        .filter((file) => file.name.endsWith('.json'))
        .filter((file) => file.name !== 'texPackages.json')
        .filter((file) => file.name !== 'texPackages.probes.json')
        .filter((file) => !file.name.endsWith('.resolved.json'))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((file) => path.join(dir, file.name));
}

const allFiles = new Set();
let totalJsonFiles = 0;

console.log('');
console.log('Generating merged TeX runtime file list');
console.log('=======================================');

for (const input of INPUT_DIRS) {
    const jsonFiles = collectJsonFiles(input.dir);

    console.log('');
    console.log(`${input.label}:`);
    console.log(`  directory: ${path.relative(projectRoot, input.dir)}`);
    console.log(`  json files: ${jsonFiles.length}`);

    totalJsonFiles += jsonFiles.length;

    for (const jsonFile of jsonFiles) {
        let files;

        try {
            files = readJsonFile(jsonFile);
        } catch (error) {
            console.error(`Could not read ${path.relative(projectRoot, jsonFile)}`);
            console.error(error.message);
            process.exit(1);
        }

        let addedFromThisFile = 0;

        for (const filename of files) {
            if (!filename || typeof filename !== 'string') {
                continue;
            }

            if (shouldIgnoreFile(filename)) {
                continue;
            }

            const beforeSize = allFiles.size;
            allFiles.add(filename);

            if (allFiles.size > beforeSize) {
                addedFromThisFile += 1;
            }
        }

        console.log(`  + ${path.relative(projectRoot, jsonFile)} (${addedFromThisFile} new files)`);
    }
}

const sortedFiles = Array.from(allFiles).sort((a, b) => a.localeCompare(b));

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sortedFiles, null, 4) + '\n');

console.log('');
console.log(`Merged JSON files: ${totalJsonFiles}`);
console.log(`Runtime files:     ${sortedFiles.length}`);
console.log(`Generated:         ${path.relative(projectRoot, OUTPUT_FILE)}`);
console.log('');