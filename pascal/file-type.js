'use strict';

module.exports = class FileType {
    constructor(type, _packed) {
        this.fileType = true;
        this.type = type;
    }

    binaryen(_e) {
        throw 'Cannot pass file by value';
    }

    matches(other) {
        if (other.fileType) {
            return this.type.matches(other.type);
        }

        return false;
    }

    isInteger() {
        return false;
    }

    bytes(e) {
        return 4 + this.type.bytes(e);
    }

    initializer(_e) {
        return 'new FileHandle()';
    }

    generate(e) {
        return `file of type ${this.type.generate(e)}`;
    }
};
