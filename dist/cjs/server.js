"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSlice = UpdateSlice;
const react_1 = __importDefault(require("react"));
const UpdateSlice_js_1 = require("./UpdateSlice.js");
/**
 * Server and client components update in separate environments.
 * This will create a client boundary and serialize the given state to the client.
 * This is used to ensure that the slice state is available on the client side.
 */
function UpdateSlice({ reducer, state, replace = false, children }) {
    if (replace) {
        reducer.replaceSlice(state);
    }
    else {
        reducer.updateSlice(state);
    }
    return (react_1.default.createElement(UpdateSlice_js_1.UpdateSlice, { reducer: reducer, state: state, replace: replace }, children));
}
