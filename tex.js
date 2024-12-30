#!/usr/bin/env node

const fs = require('fs');
const library = require('./library');
const { pages } = require('./commonMemory');

const code = fs.readFileSync(`${__dirname}/tex.wasm`);
const memory = new WebAssembly.Memory({ initial: pages, maximum: pages });
const buffer = new Uint8Array(memory.buffer);

const f = fs.openSync(`${__dirname}/core.dump`, 'r');
if (fs.readSync(f, buffer, 0, pages * 65536) != pages * 65536) throw 'Could not load memory dump';

library.setMemory(memory.buffer);
library.setInput(`${process.argv[2]}\n\\end\n`);

WebAssembly.instantiate(code, { library, env: { memory } }).then((wasm) => {
    wasm.instance.exports.main();

    if (process.argv.length < 4) return;

    // Save the files used by this instance to a json file.
    let filesystem = library.getUsedFiles();

    // Don't save the input filename or any generated aux files.
    delete filesystem[process.argv[2]];
    for (const filename in filesystem) {
        if (/\.aux$/.test(filename)) delete filesystem[filename];
    }

    fs.writeFileSync(
        `${process.argv[2].replace(/\.tex$/, '')}.resolved.json`,
        JSON.stringify(filesystem, null, '\t') + '\n'
    );
    fs.writeFileSync(
        `${process.argv[2].replace(/\.tex$/, '')}.json`,
        JSON.stringify(Object.keys(filesystem), null, '\t') + '\n'
    );
});
