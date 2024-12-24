'use strict';

const Environment = require('../environment.js');

module.exports = class Nop {
    constructor() {}

    gotos() {
        return [];
    }

    generate(environment) {
        return new Environment(environment).module.nop();
    }
};
