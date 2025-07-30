const fs = require('fs');
const process = require('process');
const kpathsea = require('node-kpathsea');

const files = [];

const Kpathsea = kpathsea.Kpathsea;
const FILE_FORMAT = kpathsea.FILE_FORMAT;
const kpse = new Kpathsea('latex');

const usedFiles = {};

let memory = undefined;
let inputBuffer = undefined;
let callback = undefined;
let texPool = 'tex.pool';

let wasmExports;
let finished = null;

const deferredPromise = () => {
    let _resolve, _reject;

    let promise = new Promise((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
    });
    promise.resolve = _resolve;
    promise.reject = _reject;

    return promise;
};

module.exports = {
    setMemory(m) {
        memory = m;
    },

    setWasmExports(m) {
        wasmExports = m;
    },

    async executeAsync(exports) {
        wasmExports = exports;

        finished = deferredPromise();

        wasmExports.main();
        wasmExports.asyncify_stop_unwind();

        return finished;
    },

    setTexPool(m) {
        texPool = m;
    },

    setInput(input, cb) {
        inputBuffer = input;
        if (cb) callback = cb;
    },

    getUsedFiles() {
        return usedFiles;
    },

    getCurrentMinutes() {
        const d = new Date();
        return 60 * d.getHours() + d.getMinutes();
    },

    getCurrentDay() {
        return new Date().getDate();
    },

    getCurrentMonth() {
        return new Date().getMonth() + 1;
    },

    getCurrentYear() {
        return new Date().getFullYear();
    },

    printString(descriptor, x) {
        const file = descriptor < 0 ? { stdout: true } : files[descriptor];
        const length = new Uint8Array(memory, x, 1)[0];
        const buffer = new Uint8Array(memory, x + 1, length);
        const string = String.fromCharCode.apply(null, buffer);

        if (file.stdout) {
            process.stdout.write(string, () => {});
            return;
        }

        fs.writeSync(file.descriptor, string);
    },

    printBoolean(descriptor, x) {
        const file = descriptor < 0 ? { stdout: true } : files[descriptor];

        const result = x ? 'TRUE' : 'FALSE';

        if (file.stdout) {
            process.stdout.write(result);
            return;
        }

        fs.writeSync(file.descriptor, result);
    },

    printChar(descriptor, x) {
        const file = descriptor < 0 ? { stdout: true } : files[descriptor];
        if (file.stdout) {
            process.stdout.write(String.fromCharCode(x));
            return;
        }

        const b = Buffer.alloc(1);
        b[0] = x;
        fs.writeSync(file.descriptor, b);
    },

    printInteger(descriptor, x) {
        const file = descriptor < 0 ? { stdout: true } : files[descriptor];
        if (file.stdout) {
            process.stdout.write(x.toString());
            return;
        }

        fs.writeSync(file.descriptor, x.toString());
    },

    printFloat(descriptor, x) {
        const file = descriptor < 0 ? { stdout: true } : files[descriptor];
        if (file.stdout) {
            process.stdout.write(x.toString());
            return;
        }

        fs.writeSync(file.descriptor, x.toString());
    },

    printNewline(descriptor, _x) {
        const file = descriptor < 0 ? { stdout: true } : files[descriptor];
        if (file.stdout) {
            process.stdout.write('\n');
            return;
        }

        fs.writeSync(file.descriptor, '\n');
    },

    reset(length, pointer) {
        const buffer = new Uint8Array(memory, pointer, length);
        let filename = String.fromCharCode.apply(null, buffer);

        filename = filename.replace(/\000+$/g, '');

        if (filename.startsWith('{')) {
            filename = filename.replace(/^{/g, '');
            filename = filename.replace(/}.*/g, '');
        }

        if (filename.startsWith('"')) {
            filename = filename.replace(/^"/g, '');
            filename = filename.replace(/".*/g, '');
        }

        filename = filename.replace(/ +$/g, '');
        filename = filename.replace(/^\*/, '');

        let format = FILE_FORMAT.TEX;

        if (filename.startsWith('TeXfonts:')) {
            filename = filename.replace(/^TeXfonts:/, '');
            format = FILE_FORMAT.TFM;
        }

        if (filename == 'TeXformats:TEX.POOL' || filename == 'tex.pool') {
            filename = texPool;
            format = FILE_FORMAT.TEXPOOL;
        }

        if (filename == 'TTY:') {
            files.push({
                filename: 'stdin',
                stdin: true,
                position: 0,
                position2: 0,
                erstat: 0,
                eoln: false,
                content: Buffer.from(inputBuffer)
            });
            return files.length - 1;
        }

        const path = kpse.findFile(filename, format);
        
        // Rodrigo
        // if (filename.includes('tkz')) { 
        //     console.log("================== TKZ-TAB DETECTED !! =========================");
        //     console.log("FILENAME=", filename);
        //     console.log("PATH=", path);
        //     console.log("FORMAT=", format);
        //     console.log("===================")
        // }

        if (path == undefined) {
            files.push({
                filename: filename,
                erstat: /\.(aux|log|dvi|tex)$/.test(filename) ? 1 : 0,
                eof: true
            });
            return files.length - 1;
        }

        usedFiles[filename] = path;

        files.push({
            filename: filename,
            position: 0,
            position2: 0,
            erstat: 0,
            eoln: false,
            descriptor: fs.openSync(path, 'r'),
            content: fs.readFileSync(path)
        });

        return files.length - 1;
    },

    rewrite(length, pointer) {
        const buffer = new Uint8Array(memory, pointer, length);
        let filename = String.fromCharCode.apply(null, buffer);

        filename = filename.replace(/ +$/g, '');

        if (filename.startsWith('"')) {
            filename = filename.replace(/^"/g, '');
            filename = filename.replace(/".*/g, '');
        }

        if (filename == 'TTY:') {
            files.push({ filename: 'stdout', stdout: true, erstat: 0 });
            return files.length - 1;
        }

        files.push({
            filename: filename,
            position: 0,
            writing: true,
            erstat: 0,
            output: [],
            descriptor: fs.openSync(filename, 'w')
        });

        return files.length - 1;
    },

    getfilesize(length, pointer) {
        const buffer = new Uint8Array(memory, pointer, length);
        let filename = String.fromCharCode.apply(null, buffer);

        if (filename.startsWith('{')) {
            filename = filename.replace(/^{/g, '');
            filename = filename.replace(/}.*/g, '');
        }

        filename = filename.replace(/ +$/g, '');
        filename = filename.replace(/^\*/, '');

        let format = FILE_FORMAT.TEX;
        if (filename.startsWith('TeXfonts:')) {
            filename = filename.replace(/^TeXfonts:/, '');
            format = FILE_FORMAT.TFM;
        }

        if (filename == 'TeXformats:TEX.POOL') {
            filename = 'tex.pool';
            format = FILE_FORMAT.TEXPOOL;
        }

        filename = kpse.findFile(filename, format);

        if (filename) {
            try {
                return fs.statSync(filename).size;
            } catch {
                return 0;
            }
        }

        return 0;
    },

    close(descriptor) {
        const file = files[descriptor];

        if (file.descriptor) {
            if (file.writing) {
                fs.write(file.descriptor, Buffer.concat(file.output), () => {});
            }
            fs.close(file.descriptor, () => {});
        }

        files[descriptor] = {};
    },

    eof(descriptor) {
        const file = files[descriptor];

        if (file.eof) return 1;
        else return 0;
    },

    erstat(descriptor) {
        const file = files[descriptor];
        return file.erstat;
    },

    eoln(descriptor) {
        const file = files[descriptor];

        if (file.eoln) return 1;
        else return 0;
    },

    inputln(descriptor, bypass_eoln, bufferp, firstp, lastp, _max_buf_stackp, buf_size) {
        const file = files[descriptor];
        //const last_nonblank = 0; // |last| with trailing blanks removed

        const buffer = new Uint8Array(memory, bufferp, buf_size);
        const first = new Uint32Array(memory, firstp, 1);
        const last = new Uint32Array(memory, lastp, 1);
        //const max_buf_stack = new Uint32Array(memory, max_buf_stackp, 1);

        // cf.\ Matthew 19\thinspace:\thinspace30
        last[0] = first[0];

        // input the first character of the line into |f^|
        if (bypass_eoln) {
            if (!file.eof) {
                if (file.eoln) {
                    file.position2 = file.position2 + 1;
                }
            }
        }

        if (file.eof) return false;

        let endOfLine = file.content.indexOf(10, file.position2);
        if (endOfLine < 0) endOfLine = file.content.length;

        if (file.position2 >= file.content.length) {
            if (file.stdin) {
                if (callback) callback();
                module.exports.tex_final_end();
            }

            file.eof = true;
            return false;
        } else {
            const bytesCopied = file.content.copy(buffer, first[0], file.position2, endOfLine);

            last[0] = first[0] + bytesCopied;

            while (buffer[last[0] - 1] == 32) last[0] = last[0] - 1;

            file.position2 = endOfLine;
            file.eoln = true;
        }

        return true;
    },

    get(descriptor, pointer, length) {
        const file = files[descriptor];

        const buffer = new Uint8Array(memory);

        if (file.stdin) {
            if (file.position >= inputBuffer.length) {
                buffer[pointer] = 13;
                file.eof = true;
                if (callback) callback();
                module.exports.tex_final_end();
            } else {
                buffer[pointer] = inputBuffer[file.position].charCodeAt(0);
            }
        } else {
            if (file.descriptor) {
                let endOfCopy = Math.min(file.position + length, file.content.length);

                const bytesCopied = file.content.copy(buffer, pointer, file.position, endOfCopy);

                if (bytesCopied == 0) {
                    buffer[pointer] = 0;
                    file.eof = true;
                    file.eoln = true;
                    return;
                }
            } else {
                file.eof = true;
                file.eoln = true;
                return;
            }
        }

        if (buffer[pointer] == 10 || buffer[pointer] == 13) file.eoln = true;
        else file.eoln = false;

        file.position = file.position + length;
    },

    put(descriptor, pointer, length) {
        const file = files[descriptor];
        const buffer = new Uint8Array(memory, pointer, length);

        if (file.writing) file.output.push(Buffer.from(buffer));
    },

    tex_final_end() {
        module.exports.printNewline(-1);
        if (finished) finished.resolve();
    }
};
