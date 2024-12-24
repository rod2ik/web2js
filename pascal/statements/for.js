'use strict';

const Assignment = require('./assignment');
const Operation = require('../operation');
const NumericLiteral = require('../numeric-literal');
const Identifier = require('../identifier');

let count = 1;

module.exports = class For {
    constructor(variable, start, end, skip, statement) {
        this.variable = variable;
        this.start = start;
        this.end = end;
        this.skip = skip;
        this.statement = statement;
    }

    gotos() {
        return this.statement.gotos();
    }

    generate(environment) {
        const module = environment.module;

        const loopLabel = `for${count}`;
        const blockLabel = `for${count}-done`;
        ++count;

        const end = this.end.generate(environment);

        const assignment = new Assignment(this.variable, this.start);

        let condition = module.nop();
        let initial = module.nop();
        let increment = module.nop();

        if (this.skip > 0) {
            initial = module.i32.le_s(this.start.generate(environment), end);
            condition = module.i32.eq(this.variable.generate(environment), end);
            increment = new Assignment(
                this.variable,
                new Operation('+', this.variable, new NumericLiteral(1, new Identifier('integer')))
            );
        } else {
            initial = module.i32.ge_s(this.start.generate(environment), end);
            condition = module.i32.eq(this.variable.generate(environment), end);
            increment = new Assignment(
                this.variable,
                new Operation('-', this.variable, new NumericLiteral(1, new Identifier('integer')))
            );
        }

        return module.if(
            initial,
            module.block(blockLabel, [
                assignment.generate(environment),
                module.loop(
                    loopLabel,
                    module.block(null, [
                        this.statement.generate(environment),
                        module.if(condition, module.break(blockLabel)),
                        increment.generate(environment),
                        module.break(loopLabel)
                    ])
                )
            ])
        );
    }
};
