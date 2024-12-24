#!/usr/bin/env node

const { globSync } = require('glob');
const child_process = require('child_process');
const fs = require('fs');
const logSymbols = require('log-symbols');
const colors = require('colors/safe');
const crypto = require('crypto');

let fails = 0;
let successes = 0;

process.chdir(__dirname);

function runTest(filename) {
    const source = fs.readFileSync(filename);
    const shasum = crypto.createHash('sha1').update(source);
    const hash = shasum.digest('hex');

    if (!fs.existsSync('.cache')) fs.mkdirSync('.cache');

    if (!fs.existsSync('../parser.js')) child_process.execSync('npm run build:parser');

    let desiredOutput;

    try {
        desiredOutput = fs.readFileSync(`.cache/${hash}`).toString();
    } catch {
        child_process.execSync(`fpc -Mdelphi ${filename} 2> /dev/null`);
        const executable = `./${filename.replace(/\.p$/, '')}`;
        desiredOutput = child_process.execSync(executable).toString();
        fs.unlinkSync(executable);
        fs.unlinkSync(`${executable}.o`);
        fs.writeFileSync(`.cache/${hash}`, desiredOutput);
    }

    let output;
    try {
        output = child_process.execSync(`node ../index.js ${filename} 2> /dev/null`).toString();
        fs.unlinkSync('tex.wabt');
    } catch {
        /* ignore */
    }

    if (output?.includes('Program validation failed')) {
        console.log(`  ${colors.red(logSymbols.error)} ${colors.cyan(filename)} failed validation`);
        ++fails;
        return;
    }

    if (output === desiredOutput) {
        console.log(`  ${colors.green(logSymbols.success)} ${colors.cyan(filename)}`);
        ++successes;
    } else {
        console.log(`  ${colors.red(logSymbols.error)} ${colors.cyan(filename)} gave incorrect output`);
        ++fails;
    }
}

const files = globSync('*.p', {});
console.log(`> Running ${files.length} tests\n`);
files.forEach(runTest);
console.log(`\n> Finished.  ${colors.green(`${successes} succeeded`)}. ${colors.red(`${fails} failed`)}.\n`);
