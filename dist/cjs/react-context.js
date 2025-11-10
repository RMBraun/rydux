"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStore = void 0;
const immer_1 = require("immer");
const react_1 = __importStar(require("react"));
const utils_js_1 = require("./utils.js");
const createStore = (props) => {
    const context = react_1.default.createContext((0, utils_js_1.toImmutable)({
        store: props.defaultStore,
        actions: props.actions
    }));
    const StoreProvider = ({ store: defaultStore, children }) => {
        const [store, setStore] = (0, react_1.useState)(defaultStore !== null && defaultStore !== void 0 ? defaultStore : props.defaultStore);
        const actions = (0, react_1.useMemo)(() => Object.fromEntries(Object.entries(props.actions).map(([key, action]) => [
            key,
            (value) => setStore((0, immer_1.produce)((draft) => action(draft, value)))
        ])), []);
        const value = (0, react_1.useMemo)(() => (0, utils_js_1.toImmutable)({
            store,
            actions
        }), [store]);
        return react_1.default.createElement(context.Provider, { value: value }, children);
    };
    // React context wrapper
    const useStore = (sliceFunction = (s) => s) => {
        const Context = (0, react_1.useContext)(context);
        const oldSlice = (0, react_1.useRef)(Context.store);
        const slice = (0, react_1.useMemo)(() => {
            const newSlice = sliceFunction(Context.store);
            const areEqual = (0, utils_js_1.shallowCompareAreEqual)(newSlice, oldSlice.current);
            if (areEqual) {
                return oldSlice.current;
            }
            else {
                oldSlice.current = newSlice;
                return oldSlice.current;
            }
        }, [Context.store]);
        return (0, react_1.useMemo)(() => (Object.assign(Object.assign({}, Context), { slice })), [slice]);
    };
    return {
        context,
        StoreProvider,
        useStore
    };
};
exports.createStore = createStore;
