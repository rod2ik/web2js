'use strict';

let count = 1;

module.exports = class Repeat {
    constructor(expression, statement) {
        this.expression = expression;
        this.statement = statement;
    }

    gotos() {
        return this.statement.gotos();
    }

    generate(environment) {
        const module = environment.module;

        const loopLabel = `repeat${count}`;
        const blockLabel = `repeat${count}-done`;
        ++count;

        return module.block(blockLabel, [
            module.loop(
                loopLabel,
                module.block(null, [
                    this.statement.generate(environment),
                    module.if(this.expression.generate(environment), module.break(blockLabel), module.break(loopLabel))
                ])
            )
        ]);
    }
};
