'use strict';

let count = 1;

module.exports = class While {
    constructor(expression, statement) {
        this.expression = expression;
        this.statement = statement;
    }

    gotos() {
        return this.statement.gotos();
    }

    generate(environment) {
        const module = environment.module;

        const loopLabel = `while${count}`;
        const blockLabel = `while${count}-done`;
        ++count;

        return module.block(blockLabel, [
            module.loop(
                loopLabel,
                module.if(
                    this.expression.generate(environment),
                    module.block(null, [this.statement.generate(environment), module.break(loopLabel)]),
                    module.break(blockLabel)
                )
            )
        ]);
    }
};
