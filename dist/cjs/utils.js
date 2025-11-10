"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomId = exports.toImmutable = exports.shallowCompareAreEqual = void 0;
const immer_1 = require("immer");
const shallowCompareAreEqual = (a, b) => {
    if (typeof a !== 'object' || a == null || typeof b !== 'object' || b == null) {
        return a === b;
    }
    return !Object.keys(a).some((key) => !(key in b) || a[key] !== b[key]);
};
exports.shallowCompareAreEqual = shallowCompareAreEqual;
const toImmutable = (input) => (0, immer_1.produce)(input, () => { });
exports.toImmutable = toImmutable;
const randomId = () => {
    return Math.random().toString(36).substring(2, 15);
};
exports.randomId = randomId;
