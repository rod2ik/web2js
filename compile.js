#!/usr/bin/env node

const Lexer = require('flex-js');
const fs = require('fs');
const parser = require('./parser').parser;

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

const code = fs.readFileSync(process.argv[2]).toString();
lexer.setSource(code);

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
    'optimize-stack-ir'
]);

fs.writeFileSync(process.argv[3], programModule.emitBinary());
if (process.argv.length > 4) fs.writeFileSync(process.argv[4], programModule.emitText());

console.log('Using ', program.memory.memorySize, 'bytes');
