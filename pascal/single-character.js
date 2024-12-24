'use strict';

const Identifier = require('./identifier.js');

module.exports = class SingleCharacter {
    constructor(character) {
        this.character = character;
        this.type = new Identifier('char');
    }

    generate(environment) {
        return environment.module.i32.const(this.character.charCodeAt(0));
    }
};
