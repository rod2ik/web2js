#!/usr/bin/env node

const Binaryen = require('binaryen');
const Lexer = require('flex-js');
const fs = require('fs');
const kpathsea = require('node-kpathsea');
const parser = require('./parser').parser;
const { pages } = require('./commonMemory');

Binaryen.setOptimizeLevel(0);
Binaryen.setPassArgument('asyncify-ignore-indirect', 'true');
Binaryen.setPassArgument('asyncify-imports', 'library.reset');

const lexer = new Lexer();

let last_token;

// definitions
lexer.addDefinition('DIGIT', /[0-9]/);
lexer.addDefinition('ALPHA', /[a-zA-Z]/);
lexer.addDefinition('ALPHANUM', /([0-9]|[a-zA-z]|_)/);
lexer.addDefinition('IDENTIFIER', /[a-zA-Z]([0-9]|[a-zA-Z]|_)*/);
lexer.addDefinition('NUMBER', /[0-9]+/);
lexer.addDefinition('SIGN', /(\+|-)/);
lexer.addDefinition('SIGNED', /(\+|-)?[0-9]+/);
lexer.addDefinition('REAL', /([0-9]+\.[0-9]+|[0-9]+\.[0-9]+e(\+|-)?[0-9]+|[0-9]+e(\+|-)?[0-9]+)/);
lexer.addDefinition('COMMENT', /(({[^}]*})|(\(\*([^*]|\*[^)])*\*\)))/);
lexer.addDefinition('W', /([ \n\t]+)+/);

lexer.addRule('{', (lexer) => {
    while (lexer.input() != '}');
});

lexer.addRule(/{W}/);

lexer.addRule('packed', () => 'packed');
lexer.addRule('forward', () => 'forward');
lexer.addRule('and', () => 'and');
lexer.addRule('array', () => 'array');
lexer.addRule('begin', () => 'begin');
lexer.addRule('case', () => 'case');
lexer.addRule('const', () => 'const');
lexer.addRule('div', () => 'div');
lexer.addRule('do', () => 'do');
lexer.addRule('downto', () => 'downto');
lexer.addRule('else', () => 'else');
lexer.addRule('end', () => 'end');
lexer.addRule('file', () => 'file');
lexer.addRule('for', () => 'for');
lexer.addRule('function', () => 'function');
lexer.addRule('goto', () => 'goto');
lexer.addRule('if', () => 'if');
lexer.addRule('label', () => 'label');
lexer.addRule('mod', () => 'mod');
lexer.addRule('not', () => 'not');
lexer.addRule('of', () => 'of');
lexer.addRule('or', () => 'or');
lexer.addRule('procedure', () => 'procedure');
lexer.addRule('program', () => 'program');
lexer.addRule('record', () => 'record');
lexer.addRule('repeat', () => 'repeat');
lexer.addRule('then', () => 'then');
lexer.addRule('to', () => 'to');
lexer.addRule('type', () => 'type');
lexer.addRule('until', () => 'until');
lexer.addRule('var', () => 'var');
lexer.addRule('while', () => 'while');
lexer.addRule('others', () => 'others');
lexer.addRule('true', () => 'true');
lexer.addRule('false', () => 'false');

lexer.addRule(/'([^']|'')'/, () => 'single_char');

lexer.addRule(/'([^']|'')+'/, (lexer) => {
    if (lexer.text == "''''" || lexer.text.length == 3) {
        lexer.reject();
    } else return 'string_literal';
});

lexer.addRule('+', () => {
    if (
        last_token == 'identifier' ||
        last_token == 'i_num' ||
        last_token == 'r_num' ||
        last_token == ')' ||
        last_token == ']'
    )
        return '+';
    else return 'unary_plus';
});

lexer.addRule('-', (lexer) => {
    if (
        last_token == 'identifier' ||
        last_token == 'i_num' ||
        last_token == 'r_num' ||
        last_token == ')' ||
        last_token == ']'
    )
        return '-';
    else {
        let c;
        while ((c = lexer.input()) == ' ' || c == '\t') {
            /* do nothing */
        }
        lexer.unput(c);
        if (parseInt(c).toString() != c) {
            return 'unary_minus';
        }
        lexer.reject();
    }
});

lexer.addRule(/-?{REAL}/, () => 'r_num');

lexer.addRule(/-?{NUMBER}/, (lexer) => {
    if (
        last_token == 'identifier' ||
        last_token == 'i_num' ||
        last_token == 'r_num' ||
        last_token == ')' ||
        last_token == ']'
    )
        lexer.reject();

    return 'i_num';
});

lexer.addRule('*', () => '*');
lexer.addRule('/', () => '/');
lexer.addRule('=', () => '=');
lexer.addRule('<>', () => '<>');
lexer.addRule('<', () => '<');
lexer.addRule('>', () => '>');
lexer.addRule('<=', () => '<=');
lexer.addRule('>=', () => '>=');
lexer.addRule('(', () => '(');
lexer.addRule(')', () => ')');
lexer.addRule('[', () => '[');
lexer.addRule(']', () => ']');
lexer.addRule(':=', () => 'assign');
lexer.addRule('..', () => '..');
lexer.addRule('.', () => '.');
lexer.addRule(',', () => ',');
lexer.addRule(';', () => ';');
lexer.addRule(':', () => ':');
lexer.addRule('^', () => '^');

lexer.addRule(/{IDENTIFIER}/, () => 'identifier');

lexer.addRule(/./, () => '..');

lexer.setSource(fs.readFileSync(process.argv[2]).toString());

parser.lexer = {
    lex() {
        const token = lexer.lex();
        last_token = token;
        this.yytext = lexer.text;
        //console.log(lexer.text);
        return token;
    },
    setInput(_str) {}
};

const program = parser.parse();

const programModule = program.generate();

programModule.runPasses([
    'remove-unused-brs',
    'pick-load-signs',
    'precompute',
    'precompute-propagate',
    'code-pushing',
    'duplicate-function-elimination',
    'inlining-optimizing',
    'dae-optimizing',
    'generate-stack-ir',
    'optimize-stack-ir',
    'asyncify'
]);

// Get the binary in typed array form
const binary = programModule.emitBinary();

if (!programModule.validate()) {
    console.log('Program validation failed');
    process.exit();
}

fs.writeFileSync('tex.wabt', binary);

// The Binaryen module is no longer needed, so tell it to clean itself up.
programModule.dispose();

const code = new WebAssembly.Module(binary);

const memory = new WebAssembly.Memory({ initial: pages, maximum: pages });

const files = [];
const inputBuffer = '\nplain\n\\input sample\n';

const library = {
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
        const length = new Uint8Array(memory.buffer, x, 1)[0];
        const buffer = new Uint8Array(memory.buffer, x + 1, length);
        const string = String.fromCharCode.apply(null, buffer);

        if (file.stdout) {
            process.stdout.write(string);
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
        const buffer = new Uint8Array(memory.buffer, pointer, length);
        let filename = String.fromCharCode.apply(null, buffer);

        filename = filename.replace(/ +$/g, '');
        filename = filename.replace(/^TeXfonts:/, 'fonts/');

        if (filename == 'TeXformats:TEX.POOL') filename = 'tex.pool';

        if (filename == 'TTY:') {
            files.push({ filename: 'stdin', stdin: true, position: 0 });
            return files.length - 1;
        }

        files.push({
            filename: filename,
            position: 0,
            descriptor: fs.openSync(filename, 'r')
        });

        return files.length - 1;
    },

    rewrite(length, pointer) {
        const buffer = new Uint8Array(memory.buffer, pointer, length);
        let filename = String.fromCharCode.apply(null, buffer);

        filename = filename.replace(/ +$/g, '');

        if (filename == 'TTY:') {
            files.push({ filename: 'stdout', stdout: true });
            return files.length - 1;
        }

        files.push({
            filename: filename,
            position: 0,
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

        let format = kpathsea.FILE_FORMAT.TEX;
        if (filename.startsWith('TeXfonts:')) {
            filename = filename.replace(/^TeXfonts:/, '');
            format = kpathsea.FILE_FORMAT.TFM;
        }

        if (filename == 'TeXformats:TEX.POOL') {
            filename = 'tex.pool';
            format = kpathsea.FILE_FORMAT.TEXPOOL;
        }

        filename = new kpathsea.Kpathsea('latex').findFile(filename, format);

        if (filename) {
            try {
                const stats = fs.statSync(filename);

                return stats.size;
            } catch {
                return 0;
            }
        }

        return 0;
    },

    close(descriptor) {
        const file = files[descriptor];

        if (file.descriptor) fs.closeSync(file.descriptor);

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
            if (file.stdin) library.tex_final_end();
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

        const buffer = new Uint8Array(memory.buffer);

        if (file.stdin) {
            if (file.position >= inputBuffer.length) buffer[pointer] = 13;
            else buffer[pointer] = inputBuffer[file.position].charCodeAt(0);
        } else {
            if (fs.readSync(file.descriptor, buffer, pointer, length, file.position) == 0) {
                buffer[pointer] = 0;
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

        const buffer = new Uint8Array(memory.buffer);

        fs.writeSync(file.descriptor, buffer, pointer, length);
    },

    tex_final_end() {
        module.exports.printNewline(-1);
    }
};

// Compile execute the web assembly module.
try {
    const wasm = new WebAssembly.Instance(code, { library, env: { memory } });
    wasm.exports.main();
} catch (e) {
    console.log(e);
}
