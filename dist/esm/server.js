import React from 'react';
import { UpdateSlice as UpdateSliceClient } from './UpdateSlice.js';
/**
 * Server and client components update in separate environments.
 * This will create a client boundary and serialize the given state to the client.
 * This is used to ensure that the slice state is available on the client side.
 */
export function UpdateSlice({ reducer, state, replace = false, children }) {
    if (replace) {
        reducer.replaceSlice(state);
    }
    else {
        reducer.updateSlice(state);
    }
    return (React.createElement(UpdateSliceClient, { reducer: reducer, state: state, replace: replace }, children));
}
