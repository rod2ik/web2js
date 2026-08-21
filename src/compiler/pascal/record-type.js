'use strict';

module.exports = class RecordType {
    constructor(fields, packed) {
        this.fields = fields;
        this.packed = packed;
    }

    bytes(e) {
        return this.fields.map((f) => f.bytes(e)).reduce((a, b) => a + b, 0);
    }

    matches(_other) {
        return true;
    }

    initializer(_e) {
        return '{}';
    }

    generate(e) {
        return `record(${this.fields.map((t) => (Array.isArray(t) ? '???' : t.generate(e))).join(',')})`;
    }
};
