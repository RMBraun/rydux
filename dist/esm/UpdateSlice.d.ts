import React, { PropsWithChildren } from 'react';
import { type Reducer } from './index.js';
/**
 * Create a client boundary and serialize the given state to the client.
 * This component is used to ensure that the slice state is available on the client side.
 */
export declare function UpdateSlice<R extends Reducer>({ reducer, state, replace, children }: PropsWithChildren<{
    reducer: R;
    state: R['__slice_type'];
    replace?: boolean;
}>): React.JSX.Element;
//# sourceMappingURL=UpdateSlice.d.ts.map