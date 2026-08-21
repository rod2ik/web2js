'use strict';

module.exports = class Pointer {
    constructor(referent) {
        this.referent = referent;
    }

    generate(environment) {
        this.referent.generate(environment);

        this.type = this.referent.type;

        if (this.type.fileType) {
            this.type = this.type.type;
            this.variable = environment.program.memory.variable(
                '',
                environment.resolveType(this.type),
                4,
                this.referent.variable.pointer()
            );
            return this.variable.get();
        }

        throw 'Do not know how to create pointers.';
    }
};
