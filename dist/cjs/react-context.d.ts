import { Draft, Immutable } from 'immer';
import React from 'react';
type Action<S> = (store: Draft<S>, value?: any) => void;
export declare const createStore: <S extends Record<string, unknown>, A extends Record<string, Action<S>>, Actions extends { [k in keyof A]: Parameters<A[k]>[1] extends undefined ? () => void : (value: Parameters<A[k]>[1]) => void; }>(props: {
    defaultStore: S;
    actions: A;
}) => {
    context: React.Context<{
        readonly store: Immutable<S>;
        readonly actions: Immutable<Actions>;
    }>;
    StoreProvider: React.FC<React.PropsWithChildren<{
        store?: S;
    }>>;
    useStore: <R extends object>(sliceFunction?: (store: Immutable<S>) => Immutable<R>) => {
        slice: Immutable<R>;
        store: Immutable<S>;
        actions: Immutable<Actions>;
    };
};
export {};
//# sourceMappingURL=react-context.d.ts.map