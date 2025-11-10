"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSlice = useSlice;
const react_1 = require("react");
const utils_js_1 = require("./utils.js");
function useSlice(reducer, pickFunction = (slice) => slice) {
    const [state, setState] = (0, react_1.useState)(() => pickFunction(reducer.getSlice()));
    (0, react_1.useEffect)(() => {
        const handleUpdate = (newSlice) => {
            setState((prevState) => {
                const newState = pickFunction(newSlice);
                if ((0, utils_js_1.shallowCompareAreEqual)(newState, prevState)) {
                    return prevState;
                }
                return newState;
            });
        };
        reducer.addListener(handleUpdate);
        return () => {
            reducer.removeListener(handleUpdate);
        };
    }, [setState, pickFunction]);
    return state;
}
