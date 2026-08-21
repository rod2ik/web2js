#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const GENERATED_TEX_FILES = 'build/tex_files.generated.json';
const TARGET_TIKZJAX_DIR = '../tikzjax';
const TARGET_TEX_FILES = 'tex_files.json';

const projectRoot = path.resolve(__dirname, '../..');

const generatedPath = path.resolve(projectRoot, GENERATED_TEX_FILES);
const tikzjaxRoot = path.resolve(projectRoot, TARGET_TIKZJAX_DIR);
const targetPath = path.join(tikzjaxRoot, TARGET_TEX_FILES);

function readJsonArray(filePath, label) {
    if (!fs.existsSync(filePath)) {
        console.error(`Missing ${label}: ${filePath}`);
        process.exit(1);
    }

    let value;

    try {
        value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error(`Could not parse ${label}: ${filePath}`);
        console.error(error.message);
        process.exit(1);
    }

    if (!Array.isArray(value)) {
        console.error(`${label} must be a JSON array: ${filePath}`);
        process.exit(1);
    }

    for (const item of value) {
        if (typeof item !== 'string') {
            console.error(`${label} contains a non-string item: ${JSON.stringify(item)}`);
            process.exit(1);
        }
    }

    return value;
}

function uniqueSorted(values) {
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

const generatedFiles = readJsonArray(generatedPath, 'generated TeX files');
const existingFiles = readJsonArray(targetPath, 'TikZJax tex_files.json');

const existingSet = new Set(existingFiles);

const missingFiles = generatedFiles
    .filter((file) => !existingSet.has(file))
    .sort((a, b) => a.localeCompare(b));

const mergedFiles = uniqueSorted([...existingFiles, ...generatedFiles]);

console.log('');
console.log('TikZJax TeX files deployment');
console.log('============================');
console.log(`Generated source: ${path.relative(projectRoot, generatedPath)}`);
console.log(`TikZJax target:   ${path.relative(projectRoot, targetPath)}`);
console.log(`Existing files:   ${existingFiles.length}`);
console.log(`Generated files:  ${generatedFiles.length}`);
console.log(`Missing files:    ${missingFiles.length}`);
console.log(`Merged total:     ${mergedFiles.length}`);
console.log('');

if (missingFiles.length === 0) {
    console.log('No missing files. tikzjax/tex_files.json is already up to date.');
    process.exit(0);
}

console.log('Files added to tikzjax/tex_files.json:');
for (const file of missingFiles) {
    console.log(`  + ${file}`);
}

fs.writeFileSync(targetPath, JSON.stringify(mergedFiles, null, 4) + '\n');

console.log('');
console.log(`Updated: ${path.relative(projectRoot, targetPath)}`);
console.log('');
console.log('Next commands:');
console.log('  cd ../tikzjax');
console.log('  yarn gen-tex-files');
console.log('  yarn build');
console.log('  yarn validate:dist');