import { useEffect, useState } from 'react';
import { shallowCompareAreEqual } from './utils.js';
export function useSlice(reducer, pickFunction = (slice) => slice) {
    const [state, setState] = useState(() => pickFunction(reducer.getSlice()));
    useEffect(() => {
        const handleUpdate = (newSlice) => {
            setState((prevState) => {
                const newState = pickFunction(newSlice);
                if (shallowCompareAreEqual(newState, prevState)) {
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
