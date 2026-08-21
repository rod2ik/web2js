'use strict';

const Desig = require('../desig');
const NumericLiteral = require('../numeric-literal');
const SingleCharacter = require('../single-character');

module.exports = class Assignment {
    constructor(lhs, rhs) {
        this.lhs = lhs;
        this.rhs = rhs;
    }

    gotos() {
        return [];
    }

    generate(environment) {
        const module = environment.module;

        const rhs = this.rhs.generate(environment);
        this.lhs.generate(environment);
        let lhsType = environment.resolveType(this.lhs.type);

        if (this.rhs.type.name == 'string' && this.lhs.type.componentType) {
            if (this.rhs.text) {
                const commands = [];

                for (let i = 0; i < Math.min(this.rhs.text.length, this.lhs.type.index.range()); ++i) {
                    const d = new Desig(this.lhs, new NumericLiteral(i + this.lhs.type.index.minimum()));
                    d.generate(environment);
                    const c = new SingleCharacter(this.rhs.text[i]);
                    commands.push(d.variable.set(c.generate(environment)));
                }

                for (
                    let i = Math.min(this.rhs.text.length, this.lhs.type.index.range());
                    i < this.lhs.type.index.range();
                    ++i
                ) {
                    const d = new Desig(this.lhs, new NumericLiteral(i + this.lhs.type.index.minimum()));
                    d.generate(environment);
                    const c = new SingleCharacter('\x00');
                    commands.push(d.variable.set(c.generate(environment)));
                }

                return module.block(null, commands);
            } else {
                throw 'Only handle assignment of string literal to array.';
            }
        }

        if (this.rhs.type.name == 'integer' && this.lhs.type.name == 'real') {
            return environment.resolveVariable(this.lhs).set(module.f32.convert_s.i32(rhs));
        }

        lhsType = environment.resolveType(this.lhs.type);
        this.lhs.variable.type = lhsType;
        const width = lhsType.bytes();

        if (width > 2 && width != 4 && width != 8) {
            if (this.rhs.variable && this.lhs.variable) {
                const commands = [];

                for (const i in this.rhs.type.fields) {
                    const field = this.rhs.type.fields[i];

                    for (const j in field.names) {
                        const name = field.names[j];

                        commands.push(
                            new Assignment(new Desig(this.lhs, name), new Desig(this.rhs, name)).generate(environment)
                        );
                    }
                }

                return module.block(null, commands);
            }

            throw `Too big at ${this.lhs.type.bytes()}`;
        }

        return this.lhs.variable.set(rhs);
    }
};
