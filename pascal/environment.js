'use strict';

const ArrayType = require('./array-type');
const RecordDeclaration = require('./record-declaration');
const VariantDeclaration = require('./variant-declaration');
const RecordType = require('./record-type');
const FileType = require('./file-type');
const binaryen = require('binaryen');

module.exports = class Environment {
    constructor(parent, name) {
        this.parent = parent;
        if (parent) {
            this.functionIdentifier = parent.functionIdentifier;
            this.program = parent.program;
        }

        this.name = name;
        this.labels = {};
        this.constants = {};
        this.variables = {};
        this.types = {};
        this.functions = {};

        this.setVariable = {};
        this.getVariable = {};

        if (parent) this.module = parent.module;
        else this.module = new binaryen.Module();
    }

    resolveLabel(label) {
        let e = this;

        while (e) {
            if (e.labels[label]) return e.labels[label];

            e = e.parent;
        }

        return undefined;
    }

    resolveTypeOnce(typeIdentifier) {
        let e = this;

        while (e) {
            if (e.types[typeIdentifier.name]) return e.types[typeIdentifier.name];

            e = e.parent;
        }

        return typeIdentifier;
    }

    resolveRecordDeclaration(f) {
        if (f.type) {
            const t = this.resolveType(f.type);
            return new RecordDeclaration(f.names, t);
        }

        if (f.variants) {
            return new VariantDeclaration(f.variants.map((v) => this.resolveType(v)));
        }

        throw `Could not resolve record declaration ${f}`;
    }

    resolveType(typeIdentifier) {
        let old = undefined;
        let resolved = typeIdentifier;

        do {
            old = resolved;
            resolved = this.resolveTypeOnce(resolved);
        } while (old != resolved);

        if (resolved.fileType) {
            return new FileType(this.resolveType(resolved.type), resolved.packed);
        }

        if (resolved.lower) {
            if (resolved.lower.name || resolved.lower.operator) {
                resolved.lower = this.resolveConstant(resolved.lower);
            }
        }

        if (resolved.upper) {
            if (resolved.upper.name || resolved.upper.operator) {
                resolved.upper = this.resolveConstant(resolved.upper);
            }
        }

        if (resolved.componentType) {
            return new ArrayType(this.resolveType(resolved.index), this.resolveType(resolved.componentType));
        }

        if (resolved.fields) {
            return new RecordType(
                resolved.fields.map((f) => this.resolveRecordDeclaration(f)),
                resolved.packed
            );
        }

        return resolved;
    }

    resolveConstant(c) {
        if (c.operator == '-') {
            c = this.resolveConstant(c.operand);
            c = Object.assign({}, c);
            c.number = c.number * -1;
            return c;
        }

        let e = this;

        while (e) {
            if (e.constants[c.name]) return e.constants[c.name];

            e = e.parent;
        }

        return undefined;
    }

    resolveFunction(c) {
        let e = this;

        while (e) {
            if (e.functions[c.name]) return e.functions[c.name];

            e = e.parent;
        }

        return undefined;
    }

    resolveVariable(variableIdentifier) {
        let e = this;

        while (e) {
            if (e.variables[variableIdentifier.name]) return e.variables[variableIdentifier.name];

            e = e.parent;
        }

        return undefined;
    }
};
