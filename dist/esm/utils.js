import { produce } from 'immer';
export const shallowCompareAreEqual = (a, b) => {
    if (typeof a !== 'object' || a == null || typeof b !== 'object' || b == null) {
        return a === b;
    }
    return !Object.keys(a).some((key) => !(key in b) || a[key] !== b[key]);
};
export const toImmutable = (input) => produce(input, () => { });
export const randomId = () => {
    return Math.random().toString(36).substring(2, 15);
};
