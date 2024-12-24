'use strict';

module.exports = class VariantDeclaration {
    constructor(variants) {
        this.variants = variants;
    }

    bytes(e) {
        return Math.max(...this.variants.map((v) => v.bytes(e)));
    }

    generate(_e) {}
};
