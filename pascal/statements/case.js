'use strict';

module.exports = class Case {
    constructor(label, statement) {
        this.label = label;
        this.statement = statement;
    }

    gotos() {
        return this.statement.gotos();
    }

    generate(environment, selector) {
        const m = environment.module;

        let condition;

        if (this.label.some((l) => l === true)) {
            condition = m.i32.const(1);
        } else {
            condition = this.label
                .map((l) => m.i32.eq(selector.generate(environment), m.i32.const(l)))
                .reduceRight((acc, current) => m.i32.or(acc, current));
        }

        return [condition, this.statement.generate(environment)];
    }
};
