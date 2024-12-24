'use strict';

const Binaryen = require('binaryen');

module.exports = class Stack {
    constructor(m, memory) {
        this.module = m;
        this.memory = memory;

        this.module.addGlobal('stack', Binaryen.i32, true, this.module.i32.const(this.memory.pages * 65536 - 1));

        this.module.addFunction(
            'getStackPointer',
            Binaryen.createType([]),
            Binaryen.i32,
            [],
            this.module.block(null, [this.module.return(this.module.global.get('stack', Binaryen.i32))])
        );
        this.module.addFunctionExport('getStackPointer', 'getStackPointer');

        this.module.addFunction(
            'setStackPointer',
            Binaryen.createType([Binaryen.i32]),
            Binaryen.none,
            [],
            this.module.block(null, [this.module.global.set('stack', this.module.local.get(0, Binaryen.i32))])
        );
        this.module.addFunctionExport('setStackPointer', 'setStackPointer');
    }

    extend(bytes) {
        return this.shrink(-bytes);
    }

    shrink(bytes) {
        return this.module.global.set(
            'stack',
            this.module.i32.add(this.module.global.get('stack', Binaryen.i32), this.module.i32.const(bytes))
        );
    }

    variable(_name, type, offset, base) {
        const stack = this;
        const memory = this.memory;
        const module = this.module;

        if (base === undefined) base = module.i32.const(0);

        return {
            offset: offset,
            type: type,
            base: base,
            set(expression) {
                return memory
                    .byType(this.type)
                    .store(this.offset, expression, module.i32.add(this.base, module.local.get(0, Binaryen.i32)));
            },
            get() {
                return memory
                    .byType(this.type)
                    .load(this.offset, module.i32.add(this.base, module.local.get(0, Binaryen.i32)));
            },
            rebase(type, base) {
                return stack.variable(this.name, type, this.offset, module.i32.add(this.base, base));
            },

            pointer() {
                return module.i32.add(
                    module.i32.const(this.offset),
                    module.i32.add(this.base, module.local.get(0, Binaryen.i32))
                );
            }
        };
    }
};
