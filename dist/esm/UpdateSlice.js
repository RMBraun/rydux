'use client';
import React, { useRef } from 'react';
/**
 * Create a client boundary and serialize the given state to the client.
 * This component is used to ensure that the slice state is available on the client side.
 */
export function UpdateSlice({ reducer, state, replace = false, children }) {
    const hasRun = useRef(false);
    if (!hasRun.current) {
        hasRun.current = true;
        if (replace) {
            reducer.replaceSlice(state);
        }
        else {
            reducer.updateSlice(state);
        }
    }
    return React.createElement(React.Fragment, null, children);
}
