'use strict';

module.exports = class Desig {
    constructor(target, desig) {
        this.target = target;
        this.desig = desig;
    }

    generate(environment) {
        // Split a desig into individual desigs

        if (this.target.generate == undefined) throw `Missing target in ${this}`;

        this.target.generate(environment);
        const variable = this.target.variable;
        const type = environment.resolveType(this.target.type);
        const module = environment.module;

        // Handle arrays
        if (type.componentType) {
            const index = this.desig.generate(environment);

            const base = module.i32.mul(
                module.i32.const(type.componentType.bytes()),
                module.i32.sub(index, module.i32.const(type.index.minimum()))
            );
            this.variable = variable.rebase(type.componentType, base);
            this.type = type.componentType;
            return this.variable.get();
        }

        if (type.fields) {
            let offset = 0;

            for (const i in type.fields) {
                const f = type.fields[i];

                if (f.variants) {
                    let maxOffset = 0;
                    for (const m in f.variants) {
                        let localOffset = 0;
                        for (const j in f.variants[m].fields) {
                            const field = f.variants[m].fields[j];
                            for (const n in field.names) {
                                if (field.names[n].name == this.desig.name) {
                                    this.variable = variable.rebase(field.type, module.i32.const(offset + localOffset));
                                    this.type = field.type;
                                    return this.variable.get();
                                }

                                localOffset += field.type.bytes();
                            }
                        }

                        if (localOffset > maxOffset) maxOffset = localOffset;
                    }

                    offset += maxOffset;
                }

                if (f.type) {
                    for (const n in f.names) {
                        const name = f.names[n];
                        if (name.name == this.desig.name) {
                            this.variable = variable.rebase(f.type, module.i32.const(offset));
                            this.type = f.type;
                            return this.variable.get();
                        }

                        offset += f.type.bytes();
                    }
                }
            }

            throw `Could not find field ${this.desig.name}`;
        }

        this.type = type;
        return variable.get();
    }
};
