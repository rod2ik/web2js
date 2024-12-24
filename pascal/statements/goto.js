'use strict';

const Binaryen = require('binaryen');
const { pages } = require('../../commonMemory');

module.exports = class Goto {
    constructor(label) {
        this.label = label;
    }

    gotos() {
        return [this.label];
    }

    generate(environment) {
        const module = environment.module;

        const label = environment.resolveLabel(this.label);

        if (label) return label.generate(environment);

        if (this.label == 9999 || this.label == 9998) {
            const jmpbuf = (pages - 100) * 1024 * 64;
            const jmpbuf_end = pages * 1024 * 64;

            return module.block(null, [
                module.i32.store(jmpbuf, 0, module.i32.const(0), module.i32.const(jmpbuf + 8)),
                module.i32.store(jmpbuf + 4, 0, module.i32.const(0), module.i32.const(jmpbuf_end)),
                module.call('start_unwind', [module.i32.const(jmpbuf)], Binaryen.none),
                module.return(this.label == 9999 ? module.i32.const(0) : Binaryen.none)
            ]);
        }

        let e = environment;
        while (e !== undefined && e.name === undefined) {
            e = e.parent;
        }

        if (e) throw `Could not find label ${this.label} in ${e.name}`;
        else throw `Could not find label ${this.label} in main`;
    }
};
