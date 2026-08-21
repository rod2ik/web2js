'use strict';

const Binaryen = require('binaryen');
const Environment = require('./environment.js');
const PointerType = require('./pointer-type.js');
const FunctionEvaluation = require('./function-evaluation.js');

let id = 0;

module.exports = class FunctionDeclaration {
    constructor(identifier, params, resultType, block) {
        this.identifier = identifier;
        this.params = params;
        this.resultType = resultType;
        this.block = block;
    }

    generate(environment) {
        const parentEnvironment = environment;
        environment = new Environment(environment, this.identifier.name);
        const module = environment.module;

        let result = Binaryen.none;
        let resultVariable;

        let offset = 0;

        const addVariable = (name, type) => {
            type = environment.resolveType(type);

            environment.variables[name] = environment.program.stack.variable(name, type, offset);

            offset = offset + type.bytes();
        };

        if (this.resultType) {
            const resolved = environment.resolveType(this.resultType);
            result = resolved.binaryen();
            addVariable(this.identifier.name, this.resultType);
            resultVariable = environment.variables[this.identifier.name];
        }

        parentEnvironment.functions[this.identifier.name] = {
            resultType: this.resultType,
            params: this.params,
            identifier: this.identifier,
            evaluate(params) {
                return new FunctionEvaluation(this.identifier, params);
            }
        };

        if (this.block === null) return;

        this.block.vars.forEach((v) => {
            for (const i in v.names) {
                addVariable(v.names[i].name, v.type);
            }
        });

        for (const i in this.params) {
            const param = this.params[i];
            let type = environment.resolveType(param.type);

            if (param.reference) type = new PointerType(type);

            // eslint-disable-next-line no-unused-vars
            for (const _j in param.names) {
                offset += type.bytes();
            }
        }

        let paramOffset = 0;

        for (const i in this.params) {
            const param = this.params[i];
            let type = environment.resolveType(param.type);

            if (param.reference) {
                type = new PointerType(type);
            }

            for (const j in param.names) {
                paramOffset += type.bytes();

                const v = environment.program.stack.variable(param.names[j].name, type, offset - paramOffset);

                if (param.reference) {
                    environment.variables[param.names[j].name] = environment.program.memory.dereferencedVariable(
                        param.names[j].name,
                        type.referent,
                        v
                    );
                } else environment.variables[param.names[j].name] = v;
            }
        }

        let code = this.block.generate(environment);

        environment.program.traces[id] = this.identifier.name;

        if (resultVariable) {
            code = module.block(null, [
                environment.program.stack.extend(offset - paramOffset),
                module.local.set(0, module.global.get('stack', Binaryen.i32)),
                code,
                module.local.set(1, resultVariable.get()),
                environment.program.stack.shrink(offset),
                module.return(module.local.get(1, result))
            ]);

            module.addFunction(this.identifier.name, Binaryen.createType([]), result, [Binaryen.i32, result], code);
        } else {
            code = module.block(null, [
                environment.program.stack.extend(offset - paramOffset),
                module.local.set(0, module.global.get('stack', Binaryen.i32)),
                code,
                environment.program.stack.shrink(offset)
            ]);
            module.addFunction(this.identifier.name, Binaryen.createType([]), result, [Binaryen.i32], code);
        }

        id = id + 1;

        return;
    }
};
