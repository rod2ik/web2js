#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const spawnSync = require('child_process').spawnSync;

const outputDir = 'tikz_libs';

fs.mkdirSync(outputDir, { recursive: true });

function kpsewhich(filename) {
    const result = spawnSync('kpsewhich', [filename], {
        encoding: 'utf8'
    });

    if (result.status !== 0) {
        return null;
    }

    const foundPath = result.stdout.trim();

    return foundPath.length > 0 ? foundPath : null;
}

function findTikzLibrariesBasePath() {
    const knownLibrary = kpsewhich('tikzlibrarytopaths.code.tex');

    if (!knownLibrary) {
        console.error('Could not locate tikzlibrarytopaths.code.tex using kpsewhich.');
        console.error('Please check that TeX Live / PGF / TikZ is installed correctly.');
        process.exit(1);
    }

    return path.dirname(knownLibrary);
}

const basePath = findTikzLibrariesBasePath();

console.log(`TikZ libraries base path: ${basePath}`);

const processDir = (dir) => {
    for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.resolve(dir, file.name);

        if (file.isDirectory()) {
            processDir(fullPath);
            continue;
        }

        if (!file.name.match(/^tikzlibrary.*\.code\.tex$/)) {
            continue;
        }

        const tikzLibName = file.name.replace(/^tikzlibrary(.*)\.code\.tex$/, '$1');

        console.log(`Processing ${tikzLibName}`);

        const texFile = path.join(outputDir, `${tikzLibName}.tex`);

        if (!fs.existsSync(texFile)) {
            console.log(`Creating ${texFile}`);

            fs.writeFileSync(
                texFile,
                [
                    '%\\documentclass[margin=0pt]{standalone}',
                    '%\\usepackage{tikz}',
                    `\\usetikzlibrary{${tikzLibName}}`,
                    '',
                    '\\begin{document}',
                    '\\end{document}',
                    ''
                ].join('\n')
            );
        }

        console.log(`Running TeX on ${texFile}`);

        const result = spawnSync('node', ['tex.js', texFile, 'y'], {
            encoding: 'utf8'
        });

        const logFile = texFile.replace(/\.tex$/, '.output.log');

        fs.writeFileSync(logFile, result.stdout + result.stderr);

        if (result.status !== 0) {
            console.error(`Failed while processing ${tikzLibName}`);
            console.error(`TeX output saved to ${logFile}`);
            process.exitCode = 1;
            continue;
        }

        console.log(`TeX output saved to ${logFile}`);
    }
};

processDir(basePath);