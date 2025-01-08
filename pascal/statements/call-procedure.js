'use strict';

const Binaryen = require('binaryen');
const FunctionEvaluation = require('../function-evaluation.js');
const Assignment = require('./assignment.js');
const Pointer = require('../pointer.js');

let count = 0;

module.exports = class CallProcedure {
    constructor(procedure, params) {
        this.procedure = procedure;
        this.params = params;
    }

    gotos() {
        return [];
    }

    generate(environment) {
        const module = environment.module;

        // No need for "break-in" functions
        if (
            this.procedure.name.toLowerCase() == 'break' ||
            this.procedure.name.toLowerCase() == 'breakin' ||
            this.procedure.name.toLowerCase() == 'break_in'
        )
            return module.nop();

        // Ignore the mode parameter to reset
        if (this.procedure.name.toLowerCase() == 'reset' || this.procedure.name.toLowerCase() == 'get') {
            const commands = [];

            if (this.procedure.name.toLowerCase() == 'reset') {
                const file = this.params[0];
                file.generate(environment);

                const filename = this.params[1];
                const filenameExp = filename.generate(environment);
                let result = undefined;

                if (filename.type.name == 'string') {
                    result = module.call(
                        'reset',
                        [module.i32.load8_u(0, 0, filenameExp), module.i32.add(module.i32.const(1), filenameExp)],
                        Binaryen.i32
                    );
                } else {
                    result = module.call(
                        'reset',
                        [module.i32.const(filename.type.index.range()), filename.variable.pointer()],
                        Binaryen.i32
                    );
                }

                commands.push(file.variable.set(result));
            }

            const file = this.params[0];
            const descriptor = file.generate(environment);
            const fileType = environment.resolveType(file.type);

            const data = module.i32.add(module.i32.const(4), file.variable.pointer());

            commands.push(
                module.call('get', [descriptor, data, module.i32.const(fileType.type.bytes())], Binaryen.none)
            );

            return module.block(null, commands);
        }

        // Ignore the mode parameter to rewrite
        if (this.procedure.name.toLowerCase() == 'rewrite') {
            const file = this.params[0];
            file.generate(environment);

            const filename = this.params[1];
            const filenameExp = filename.generate(environment);
            let result = undefined;

            if (filename.type.name == 'string') {
                result = module.call(
                    'rewrite',
                    [module.i32.load8_u(0, 0, filenameExp), module.i32.add(module.i32.const(1), filenameExp)],
                    Binaryen.i32
                );
            } else {
                result = module.call(
                    'rewrite',
                    [module.i32.const(filename.type.index.range()), filename.variable.pointer()],
                    Binaryen.i32
                );
            }

            return file.variable.set(result);
        }

        if (this.procedure.name == 'readln' || this.procedure.name == 'read_ln' || this.procedure.name == 'read') {
            let file = undefined;
            const commands = [];

            let descriptor;
            let fileType;
            let data;

            for (const p of this.params) {
                p.generate(environment);
                const type = environment.resolveType(p.type);

                if (type.fileType) {
                    file = p;
                    descriptor = file.generate(environment);
                    fileType = environment.resolveType(file.type);

                    data = module.i32.add(module.i32.const(4), file.variable.pointer());
                } else {
                    if (file) {
                        const assignment = new Assignment(p, new Pointer(file));
                        commands.push(assignment.generate(environment));

                        commands.push(
                            module.call(
                                'get',
                                [descriptor, data, module.i32.const(fileType.type.bytes())],
                                Binaryen.none
                            )
                        );
                    }
                }
            }

            if (this.procedure.name == 'readln' || this.procedure.name == 'read_ln') {
                if (file) {
                    const loopLabel = `readln${count}`;
                    const blockLabel = `readln${count}-done`;
                    count = count + 1;

                    const condition = module.i32.eq(
                        module.call('eoln', [descriptor], Binaryen.i32),
                        module.i32.const(0)
                    );

                    const getMore = module.call(
                        'get',
                        [descriptor, data, module.i32.const(fileType.type.bytes())],
                        Binaryen.none
                    );

                    const loop = module.block(blockLabel, [
                        module.loop(
                            loopLabel,
                            module.if(
                                condition,
                                module.block(null, [getMore, module.break(loopLabel)]),
                                module.break(blockLabel)
                            )
                        )
                    ]);

                    const skip = module.call(
                        'get',
                        [descriptor, data, module.i32.const(fileType.type.bytes())],
                        Binaryen.none
                    );

                    commands.push(module.block(null, [loop, skip]));
                }
            }

            return module.block(null, commands);
        }

        // FIXME
        if (this.procedure.name == 'put') {
            const file = this.params[0];
            const descriptor = file.generate(environment);
            const fileType = environment.resolveType(file.type);

            const data = module.i32.add(module.i32.const(4), file.variable.pointer());

            return module.call('put', [descriptor, data, module.i32.const(fileType.type.bytes())], Binaryen.none);
        }

        if (this.procedure.name == 'close') {
            const file = this.params[0];

            return module.call('close', [file.generate(environment)], Binaryen.none);
        }

        if (this.procedure.name == 'writeln' || this.procedure.name == 'write_ln' || this.procedure.name == 'write') {
            let file = undefined;

            const printers = this.params.map((p) => {
                if (p.width) p = p.expression;

                const q = p.generate(environment);
                const type = environment.resolveType(p.type);

                let printer = undefined;

                if (type.fileType) {
                    file = q;
                    return module.nop();
                }

                if (this.procedure.name === 'write' && type.isInteger() && type.bytes() == 1) printer = 'printChar';
                else if (type.isInteger()) printer = 'printInteger';
                else if (type.name === 'real') printer = 'printFloat';
                else if (type.name === 'boolean') printer = 'printBoolean';
                else if (type.name === 'string') printer = 'printString';
                else if (type.name === 'char') printer = 'printChar';
                if (printer === undefined) throw 'Could not print.';

                if (file) return module.call(printer, [file, q], Binaryen.none);
                else return module.call(printer, [module.i32.const(-1), q], Binaryen.none);
            });

            if (this.procedure.name == 'writeln' || this.procedure.name == 'write_ln') {
                if (file) printers.push(module.call('printNewline', [file], Binaryen.none));
                else printers.push(module.call('printNewline', [module.i32.const(-1)], Binaryen.none));
            }

            return module.block(null, printers);
        }

        if (this.procedure.name == 'tex_final_end') {
            return module.block(null, [module.call('tex_final_end', [], Binaryen.none)]);
        }

        const f = new FunctionEvaluation(this.procedure, this.params);

        const code = f.generate(environment);

        if (f.type == undefined) return code;
        else return module.drop(code);
    }
};
