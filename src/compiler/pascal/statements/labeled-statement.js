'use strict';

const Environment = require('../environment.js');

let count = 1;

module.exports = class LabeledStatement {
    constructor(label, statement) {
        this.label = label;
        this.statement = statement;
    }

    gotos() {
        return this.statement.gotos();
    }

    generate(environment) {
        environment = new Environment(environment);

        const module = environment.module;

        const loopLabel = `goto${count}`;
        ++count;

        environment.labels[this.label] = {
            label: loopLabel,
            generate(environment) {
                const module = environment.module;
                return module.break(this.label);
            }
        };

        return module.loop(loopLabel, this.statement.generate(environment));
    }
};
