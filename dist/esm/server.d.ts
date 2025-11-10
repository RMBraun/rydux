import React, { PropsWithChildren } from 'react';
import { type Reducer } from './index.js';
/**
 * Server and client components update in separate environments.
 * This will create a client boundary and serialize the given state to the client.
 * This is used to ensure that the slice state is available on the client side.
 */
export declare function UpdateSlice<R extends Reducer>({ reducer, state, replace, children }: PropsWithChildren<{
    reducer: R;
    state: R['__slice_type'];
    replace?: boolean;
}>): React.JSX.Element;
//# sourceMappingURL=server.d.ts.map