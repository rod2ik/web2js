'use strict';

const Identifier = require('./identifier.js');

module.exports = class StringLiteral {
    constructor(text) {
        this.text = text.replace(/^'/, '').replace(/'$/, '').replace(/''/, "'");
        this.type = new Identifier('string');
    }

    generate(environment) {
        return environment.module.i32.const(environment.program.memory.allocateString(this.text));
    }
};
