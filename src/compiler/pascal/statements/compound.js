'use strict';

const Environment = require('../environment.js');
const Binaryen = require('binaryen');

let trampoline = 1;
let targets = 1;

module.exports = class Compound {
    constructor(statements) {
        this.statements = statements;
    }

    gotos() {
        let g = [];
        for (const f of this.statements) {
            g = g.concat(f.gotos());
        }
        return g;
    }

    generate(environment) {
        environment = new Environment(environment);
        const module = environment.module;

        let labelCount = 0;

        const labels = [];
        const target = {};
        for (const v of this.statements) {
            if (v.label && v.statement) {
                labelCount = labelCount + 1;
                labels.push(v.label);
                target[v.label] = `target${targets}`;
                targets++;
            }
        }

        if (labelCount == 0) {
            return module.block(
                null,
                this.statements.map((v) => v.generate(environment))
            );
        }

        const trampolineLabel = `trampoline${trampoline}`;
        trampoline = trampoline + 1;

        this.statements.forEach((v) => {
            if (v.label && v.statement) {
                environment.labels[v.label] = {
                    label: trampolineLabel,
                    index: labels.indexOf(v.label),
                    generate(environment) {
                        const m = environment.module;
                        return m.block(null, [
                            m.global.set('trampoline', m.i32.const(this.index)),
                            m.break(this.label)
                        ]);
                    }
                };
            }
        });

        let branch = [
            module.if(
                module.i32.ge_s(module.global.get('trampoline', Binaryen.i32), module.i32.const(0)),
                module.switch(
                    labels.map((l) => target[l]),
                    trampolineLabel,
                    module.global.get('trampoline', Binaryen.i32)
                )
            )
        ];

        this.statements.forEach((v) => {
            if (v.label && v.statement) branch = [module.block(target[v.label], branch)];
            branch.push(v.generate(environment));
        });

        return module.block(null, [
            module.global.set('trampoline', module.i32.const(-1)),
            module.loop(trampolineLabel, module.block(null, branch))
        ]);
    }
};
