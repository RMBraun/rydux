"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReducer = void 0;
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const immer_1 = require("immer");
const utils_js_1 = require("./utils.js");
const WINDOW_GLOBAL_STORE_KEY = '__rydux__global__store_instance';
const WINDOW_GLOBAL_EVENT_EMITTER_KEY = '__rydux__global__event_emitter_instance';
class EventEmitter {
    constructor() {
        this.ee = new eventemitter3_1.default();
        this.id = (0, utils_js_1.randomId)();
    }
    /**
     * Returns the singleton EventEmitter instance from the global object.
     */
    static getInstance() {
        if (!globalThis[WINDOW_GLOBAL_EVENT_EMITTER_KEY]) {
            globalThis[WINDOW_GLOBAL_EVENT_EMITTER_KEY] = new EventEmitter();
        }
        return globalThis[WINDOW_GLOBAL_EVENT_EMITTER_KEY];
    }
    /**
     * Dispatches an event to all listeners for a given key.
     * @param key The event key.
     * @param slice The slice state to emit.
     */
    dispatch(key, slice) {
        this.ee.emit(key, slice);
    }
    /**
     * Adds a listener for a given key.
     * @param key The event key.
     * @param callback The callback to invoke with the slice state.
     */
    on(key, callback) {
        this.ee.on(key, callback);
    }
    /**
     * Removes a listener for a given key.
     * @param key The event key.
     * @param callback The callback to remove.
     */
    off(key, callback) {
        this.ee.off(key, callback);
    }
}
/**
 * GlobalStore manages all slice states in a singleton, immutable store.
 */
class GlobalStore {
    constructor() {
        this.id = (0, utils_js_1.randomId)();
        this.store = (0, utils_js_1.toImmutable)({});
    }
    /**
     * Returns the singleton GlobalStore instance from the global object.
     */
    static getInstance() {
        if (!globalThis[WINDOW_GLOBAL_STORE_KEY]) {
            globalThis[WINDOW_GLOBAL_STORE_KEY] = new GlobalStore();
        }
        return globalThis[WINDOW_GLOBAL_STORE_KEY];
    }
    /**
     * Checks if a slice exists in the store.
     * @param key The slice key.
     */
    hasSlice(key) {
        return key in this.store;
    }
    /**
     * Creates a new slice in the store.
     * @param key The slice key.
     * @param slice The initial slice state.
     */
    createSlice(key, slice) {
        if (!(key in this.store)) {
            this.store = (0, immer_1.produce)(this.store, (draft) => {
                draft[key] = slice;
            });
        }
        return this.store[key];
    }
    /**
     * Gets a slice from the store.
     * @param key The slice key.
     */
    getSlice(key) {
        if (!(key in this.store)) {
            throw new Error(`Slice with key "${key}" does not exist in the global store.`);
        }
        return this.store[key];
    }
    /**
     * Replaces a slice in the store.
     * @param key The slice key.
     * @param slice The new slice state.
     */
    replaceSlice(key, slice) {
        this.store = (0, immer_1.produce)(this.store, (draft) => {
            draft[key] = slice;
        });
        return this.store[key];
    }
    /**
     * Updates a slice in the store.
     * @param key The slice key.
     * @param slice The partial slice state to merge.
     */
    updateSlice(key, slice) {
        this.store = (0, immer_1.produce)(this.store, (draft) => {
            draft[key] = Object.assign(draft[key], slice);
        });
        return this.store[key];
    }
}
/**
 * Creates a reducer with actions, state management, and event listeners.
 * @param key The unique key for this slice.
 * @param props.defaultState The initial state for the slice.
 * @param props.actions An object of reducer functions.
 * @param props.replaceIfExists Whether to replace the slice if it already exists.
 */
const createReducer = (key, props) => {
    if (GlobalStore.getInstance().hasSlice(key)) {
        console.warn(`Reducer with key "${key}" already exists in the global store. ${props.replaceIfExists ? 'Replacing' : 'Merging with'} existing state.`);
        if (props.replaceIfExists) {
            GlobalStore.getInstance().replaceSlice(key, props.defaultState);
        }
        else {
            GlobalStore.getInstance().updateSlice(key, props.defaultState);
        }
    }
    else {
        GlobalStore.getInstance().createSlice(key, props.defaultState);
    }
    /**
     * Dispatches the current slice state to all listeners.
     */
    const dispatch = () => {
        EventEmitter.getInstance().dispatch(key, GlobalStore.getInstance().getSlice(key));
    };
    const actionEntries = Object.entries(props.actions).map(([actionName, action]) => {
        return [
            actionName,
            (value, options) => {
                const newSlice = GlobalStore.getInstance().replaceSlice(key, (0, immer_1.produce)(GlobalStore.getInstance().getSlice(key), (draft) => action(draft, value)));
                if (!(options === null || options === void 0 ? void 0 : options.noDispatch)) {
                    dispatch();
                }
                return newSlice;
            }
        ];
    });
    const actions = Object.fromEntries(actionEntries);
    const chainedActions = Object.fromEntries(actionEntries.map(([actionName, action]) => {
        return [
            actionName,
            (value, options) => action(value, Object.assign(Object.assign({}, options), { noDispatch: true }))
        ];
    }));
    /**
     * Returns the current slice state.
     */
    const getSlice = () => {
        return GlobalStore.getInstance().getSlice(key);
    };
    /**
     * Replaces the slice state and optionally emits an update event.
     * @param state The new state.
     * @param options.emit Whether to emit an update event (default: true).
     */
    const replaceSlice = (state, { emit = true } = {}) => {
        const newSlice = GlobalStore.getInstance().replaceSlice(key, state);
        emit && EventEmitter.getInstance().dispatch(key, newSlice);
        return newSlice;
    };
    /**
     * Updates the slice state and optionally emits an update event.
     * @param state The new state.
     * @param options.emit Whether to emit an update event (default: true).
     */
    const updateSlice = (state, { emit = true } = {}) => {
        const newSlice = GlobalStore.getInstance().updateSlice(key, state);
        emit && EventEmitter.getInstance().dispatch(key, newSlice);
        return newSlice;
    };
    /**
     * Adds a listener for slice updates.
     * @param callback The callback to invoke with the slice state.
     */
    const addListener = (callback) => {
        EventEmitter.getInstance().on(key, callback);
    };
    /**
     * Removes a listener for slice updates.
     * @param callback The callback to remove.
     */
    const removeListener = (callback) => {
        EventEmitter.getInstance().off(key, callback);
    };
    /**
     * Chains multiple actions together and dispatches them in a single event.
     * @param batchFunction The function containing the actions to chain.
     */
    const chain = (batchFunction) => {
        batchFunction(chainedActions);
        dispatch();
    };
    return {
        key,
        actions,
        getSlice,
        replaceSlice,
        updateSlice,
        dispatch,
        addListener,
        removeListener,
        chain,
        __rydux_instance_ID: (0, utils_js_1.randomId)(),
        __slice_type: {}
    };
};
exports.createReducer = createReducer;
