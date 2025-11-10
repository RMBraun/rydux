'use client';
import { produce } from 'immer';
import React, { useContext, useMemo, useRef, useState } from 'react';
import { shallowCompareAreEqual, toImmutable } from './utils.js';
export const createStore = (props) => {
    const context = React.createContext(toImmutable({
        store: props.defaultStore,
        actions: props.actions
    }));
    const StoreProvider = ({ store: defaultStore, children }) => {
        const [store, setStore] = useState(defaultStore !== null && defaultStore !== void 0 ? defaultStore : props.defaultStore);
        const actions = useMemo(() => Object.fromEntries(Object.entries(props.actions).map(([key, action]) => [
            key,
            (value) => setStore(produce((draft) => action(draft, value)))
        ])), []);
        const value = useMemo(() => toImmutable({
            store,
            actions
        }), [store]);
        return React.createElement(context.Provider, { value: value }, children);
    };
    // React context wrapper
    const useStore = (sliceFunction = (s) => s) => {
        const Context = useContext(context);
        const oldSlice = useRef(Context.store);
        const slice = useMemo(() => {
            const newSlice = sliceFunction(Context.store);
            const areEqual = shallowCompareAreEqual(newSlice, oldSlice.current);
            if (areEqual) {
                return oldSlice.current;
            }
            else {
                oldSlice.current = newSlice;
                return oldSlice.current;
            }
        }, [Context.store]);
        return useMemo(() => (Object.assign(Object.assign({}, Context), { slice })), [slice]);
    };
    return {
        context,
        StoreProvider,
        useStore
    };
};
