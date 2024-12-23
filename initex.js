#!/usr/bin/env node

const fs = require('fs');
const library = require('./library');

const binary = fs.readFileSync('tex.wasm');

const code = new WebAssembly.Module(binary);

const pages = require('./commonMemory').pages;
const memory = new WebAssembly.Memory({ initial: pages, maximum: pages });
library.setMemory(memory.buffer);
library.setInput('\n*latex.ltx\n\\dump\n\n', function () {});

let wasm = new WebAssembly.Instance(code, { library: library, env: { memory } });
library.setWasmExports(wasm.exports);

wasm.exports.main();

library.setMemory(memory.buffer);
library.setInput(
    '\n&latex\n' +
        '\\documentclass[margin=0pt]{standalone}\n' +
        '\\def\\pgfsysdriver{pgfsys-ximera.def}\n' +
        '\\usepackage[svgnames]{xcolor}\n' +
        '\\usepackage{tikz}\n\n',
    function () {
        library.tex_final_end();
        const buffer = new Uint8Array(memory.buffer);
        fs.writeFileSync('core.dump', buffer);

        // Save the files used to a json file.
        let filesystem = library.getUsedFiles();
        fs.writeFileSync('initex-files.json', JSON.stringify(filesystem, null, '\t'));

        process.exit();
    }
);

wasm = new WebAssembly.Instance(code, { library: library, env: { memory: memory } });
library.setWasmExports(wasm.exports);

wasm.exports.main();
