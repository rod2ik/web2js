'use strict';
const Environment = require('./environment.js');

module.exports = class Block {
    constructor(labels, consts, types, vars, compound) {
        this.labels = labels;
        this.consts = consts;
        this.types = types;
        this.vars = vars;
        this.compound = compound;
    }

    generate(environment) {
        environment = new Environment(environment);

        for (const v of this.consts) {
            environment.constants[v.name] = v.expression;
        }

        for (const t of this.types) {
            environment.types[t.name] = t.expression;
        }

        return this.compound.generate(environment);
    }
};
