'use strict';

module.exports = class Switch {
    constructor(expression, cases) {
        this.expression = expression;
        this.cases = cases;
    }

    gotos() {
        let g = [];
        for (const f of this.cases) {
            g = g.concat(f.gotos());
        }
        return g;
    }

    generate(environment) {
        const m = environment.module;

        let previous = m.nop();

        for (const thisCase of this.cases.reverse()) {
            const c = thisCase.generate(environment, this.expression);
            previous = m.if(c[0], c[1], previous);
        }

        return previous;
    }
};
