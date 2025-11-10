import EE from 'eventemitter3';
declare global {
    var __rydux__global__store_instance: GlobalStore | undefined;
    var __rydux__global__event_emitter_instance: EventEmitter | undefined;
    interface Window {
        __rydux__global__store_instance: GlobalStore;
        __rydux__global__event_emitter_instance: EventEmitter;
    }
}
export type Reducer = ReturnType<typeof createReducer>;
type ActionOptions = {
    /** Prevents the action from dispatching event to listeners */
    noDispatch?: boolean;
};
type ChainedActionOptions = {
    noDispatch?: true;
};
export type SliceState = Record<string, unknown>;
type Store = Record<string, SliceState>;
declare class EventEmitter {
    ee: EE;
    id: string;
    /**
     * Returns the singleton EventEmitter instance from the global object.
     */
    static getInstance(): EventEmitter;
    /**
     * Dispatches an event to all listeners for a given key.
     * @param key The event key.
     * @param slice The slice state to emit.
     */
    dispatch(key: string, slice: SliceState): void;
    /**
     * Adds a listener for a given key.
     * @param key The event key.
     * @param callback The callback to invoke with the slice state.
     */
    on<S extends SliceState>(key: string, callback: (slice: S) => void): void;
    /**
     * Removes a listener for a given key.
     * @param key The event key.
     * @param callback The callback to remove.
     */
    off<S extends SliceState>(key: string, callback: (slice: S) => void): void;
}
/**
 * GlobalStore manages all slice states in a singleton, immutable store.
 */
declare class GlobalStore {
    id: string;
    store: Store;
    /**
     * Returns the singleton GlobalStore instance from the global object.
     */
    static getInstance(): GlobalStore;
    /**
     * Checks if a slice exists in the store.
     * @param key The slice key.
     */
    hasSlice(key: string): boolean;
    /**
     * Creates a new slice in the store.
     * @param key The slice key.
     * @param slice The initial slice state.
     */
    createSlice<S extends SliceState>(key: string, slice: S): S;
    /**
     * Gets a slice from the store.
     * @param key The slice key.
     */
    getSlice<S extends SliceState>(key: string): S;
    /**
     * Replaces a slice in the store.
     * @param key The slice key.
     * @param slice The new slice state.
     */
    replaceSlice<S extends SliceState>(key: string, slice: S): S;
    /**
     * Updates a slice in the store.
     * @param key The slice key.
     * @param slice The partial slice state to merge.
     */
    updateSlice<S extends SliceState>(key: string, slice: S): S;
}
/**
 * Creates a reducer with actions, state management, and event listeners.
 * @param key The unique key for this slice.
 * @param props.defaultState The initial state for the slice.
 * @param props.actions An object of reducer functions.
 * @param props.replaceIfExists Whether to replace the slice if it already exists.
 */
export declare const createReducer: <Slice extends SliceState, ReducerActions extends Record<string, (slice: Slice, value?: any) => void>, Key extends string>(key: Key, props: {
    /** The initial state for the reducer. */
    defaultState: Slice;
    actions: ReducerActions;
    /** Optional prop to replace slice if it already exists */
    replaceIfExists?: boolean;
}) => {
    key: Key;
    actions: { [k in keyof ReducerActions]: Parameters<ReducerActions[k]>[1] extends undefined ? (options?: ActionOptions) => Slice : undefined extends Parameters<ReducerActions[k]>[1] ? (value?: Parameters<ReducerActions[k]>[1], options?: ActionOptions) => Slice : (value: Parameters<ReducerActions[k]>[1], options?: ActionOptions) => Slice; };
    getSlice: () => Slice;
    replaceSlice: (state: Slice, { emit }?: {
        emit?: boolean | undefined;
    }) => Slice;
    updateSlice: (state: Slice, { emit }?: {
        emit?: boolean | undefined;
    }) => Slice;
    dispatch: () => void;
    addListener: (callback: (slice: Slice) => void) => void;
    removeListener: (callback: (slice: Slice) => void) => void;
    chain: (batchFunction: (actions: { [k_1 in keyof ReducerActions]: Parameters<ReducerActions[k_1]>[1] extends undefined ? (options?: ChainedActionOptions) => Slice : undefined extends Parameters<ReducerActions[k_1]>[1] ? (value?: Parameters<ReducerActions[k_1]>[1], options?: ChainedActionOptions) => Slice : (value: Parameters<ReducerActions[k_1]>[1], options?: ChainedActionOptions) => Slice; }) => void) => void;
    __rydux_instance_ID: string;
    __slice_type: Slice;
};
export {};
//# sourceMappingURL=index.d.ts.map