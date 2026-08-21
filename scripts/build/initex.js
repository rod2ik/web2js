#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const library = require('../../src/runtime/library');
const { pages } = require('../../src/runtime/commonMemory');

const projectRoot = path.resolve(__dirname, '../..');
const buildDir = path.join(projectRoot, 'build');
fs.mkdirSync(buildDir, { recursive: true });
fs.copyFileSync(
    path.join(projectRoot, 'src/tex/pgfsys-ximera.def'),
    path.join(buildDir, 'pgfsys-ximera.def')
);
process.chdir(buildDir);

const binary = fs.readFileSync('tex.wasm');

const code = new WebAssembly.Module(binary);

const initexMemory = new WebAssembly.Memory({ initial: pages, maximum: pages });
library.setMemory(initexMemory.buffer);
library.setInput('\n*latex.ltx\n\\dump\n\n', () => {});

let wasm = new WebAssembly.Instance(code, { library, env: { memory: initexMemory } });
library.setWasmExports(wasm.exports);

wasm.exports.main();

const memory = new WebAssembly.Memory({ initial: pages, maximum: pages });
library.setMemory(memory.buffer);
library.setInput(
    '\n&latex\n' +
        '\\documentclass[margin=0pt]{standalone}\n' +
        '\\def\\pgfsysdriver{pgfsys-ximera.def}\n' +
        '\\usepackage[svgnames]{xcolor}\n' +
        '\\usepackage{tikz}\n\n' +
        // '\\usepackage{tkz-tab}\n\n' +
        '\\DeclareGraphicsExtensions{}\n',
    () => {
        library.tex_final_end();
        const buffer = new Uint8Array(memory.buffer);
        fs.writeFileSync('core.dump', buffer);

        // Save the files used to a json file.
        const filesystem = library.getUsedFiles();
        fs.writeFileSync('initex-files.json', JSON.stringify(filesystem, null, '\t'));

        process.exit();
    }
);

wasm = new WebAssembly.Instance(code, { library, env: { memory } });
library.setWasmExports(wasm.exports);

wasm.exports.main();