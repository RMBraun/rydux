import EE from 'eventemitter3'
import { Draft, produce } from 'immer'
import { randomId, toImmutable } from './utils.js'

declare global {
  var __rydux__global__store_instance: GlobalStore | undefined
  var __rydux__global__event_emitter_instance: EventEmitter | undefined
  interface Window {
    __rydux__global__store_instance: GlobalStore
    __rydux__global__event_emitter_instance: EventEmitter
  }
}

export type Reducer = ReturnType<typeof createReducer>

type ActionOptions = {
  /** Prevents the action from dispatching event to listeners */
  noDispatch?: boolean
}

type ChainedActionOptions = {
  noDispatch?: true
}

export type SliceState = Record<string, unknown>

type Store = Record<string, SliceState>

const WINDOW_GLOBAL_STORE_KEY = '__rydux__global__store_instance'
const WINDOW_GLOBAL_EVENT_EMITTER_KEY = '__rydux__global__event_emitter_instance'

class EventEmitter {
  ee: EE = new EE()
  id = randomId()

  static getInstance() {
    if (!globalThis[WINDOW_GLOBAL_EVENT_EMITTER_KEY]) {
      globalThis[WINDOW_GLOBAL_EVENT_EMITTER_KEY] = new EventEmitter()
    }

    return globalThis[WINDOW_GLOBAL_EVENT_EMITTER_KEY]
  }

  dispatch(key: string, slice: SliceState) {
    this.ee.emit(key, slice)
  }

  on<S extends SliceState>(key: string, callback: (slice: S) => void) {
    this.ee.on(key, callback)
  }

  off<S extends SliceState>(key: string, callback: (slice: S) => void) {
    this.ee.off(key, callback)
  }
}

class GlobalStore {
  id = randomId()
  store: Store = toImmutable({})

  static getInstance() {
    if (!globalThis[WINDOW_GLOBAL_STORE_KEY]) {
      globalThis[WINDOW_GLOBAL_STORE_KEY] = new GlobalStore()
    }

    return globalThis[WINDOW_GLOBAL_STORE_KEY]
  }

  hasSlice(key: string) {
    return key in this.store
  }

  createSlice<S extends SliceState>(key: string, slice: S) {
    if (!(key in this.store)) {
      this.store = produce(this.store, (draft) => {
        draft[key] = slice
      })
    }

    return this.store[key] as S
  }

  getSlice<S extends SliceState>(key: string): S {
    if (!(key in this.store)) {
      throw new Error(`Slice with key "${key}" does not exist in the global store.`)
    }

    return this.store[key] as S
  }

  replaceSlice<S extends SliceState>(key: string, slice: S) {
    this.store = produce(this.store, (draft) => {
      draft[key] = slice
    })

    return this.store[key] as S
  }

  updateSlice<S extends SliceState>(key: string, slice: S) {
    this.store = produce(this.store, (draft) => {
      draft[key] = Object.assign(draft[key], slice)
    })

    return this.store[key] as S
  }
}

export const createReducer = <
  Key extends string,
  Slice extends SliceState,
  ReducerActions extends Record<string, (slice: Draft<Slice>, value?: any) => void>
>(
  key: Key,
  props: {
    /** The initial state for the reducer. */
    defaultState: Slice
    actions: ReducerActions
    /** Optional prop to replace slice if it already exists */
    replaceIfExists?: boolean
  }
) => {
  if (GlobalStore.getInstance().hasSlice(key)) {
    console.warn(
      `Reducer with key "${key}" already exists in the global store. ${
        props.replaceIfExists ? 'Replacing' : 'Merging with'
      } existing state.`
    )

    if (props.replaceIfExists) {
      GlobalStore.getInstance().replaceSlice(key, props.defaultState)
    } else {
      GlobalStore.getInstance().updateSlice(key, props.defaultState)
    }
  } else {
    GlobalStore.getInstance().createSlice(key, props.defaultState)
  }

  /**
   * Dispatches the current slice state to all listeners.
   */
  const dispatch = () => {
    EventEmitter.getInstance().dispatch(key, GlobalStore.getInstance().getSlice<Slice>(key))
  }

  type Actions = {
    [k in keyof ReducerActions]: Parameters<ReducerActions[k]>[1] extends undefined
      ? (options?: ActionOptions) => Slice
      : undefined extends Parameters<ReducerActions[k]>[1]
        ? (value?: Parameters<ReducerActions[k]>[1], options?: ActionOptions) => Slice
        : (value: Parameters<ReducerActions[k]>[1], options?: ActionOptions) => Slice
  }

  type ChainedActions = {
    [k in keyof ReducerActions]: Parameters<ReducerActions[k]>[1] extends undefined
      ? (options?: ChainedActionOptions) => Slice
      : undefined extends Parameters<ReducerActions[k]>[1]
        ? (value?: Parameters<ReducerActions[k]>[1], options?: ChainedActionOptions) => Slice
        : (value: Parameters<ReducerActions[k]>[1], options?: ChainedActionOptions) => Slice
  }

  const actionEntries = Object.entries(props.actions).map(([actionName, action]) => {
    return [
      actionName,
      (value: unknown, options?: ActionOptions) => {
        const newSlice = GlobalStore.getInstance().replaceSlice(
          key,
          produce(GlobalStore.getInstance().getSlice<Slice>(key), (draft) => action(draft, value))
        )

        if (!options?.noDispatch) {
          dispatch()
        }

        return newSlice
      }
    ]
  }) as [string, (value: unknown, options?: ActionOptions) => Slice][]

  const actions = Object.fromEntries(actionEntries) as Actions

  const chainedActions = Object.fromEntries(
    actionEntries.map(([actionName, action]) => {
      return [
        actionName,
        (value: unknown, options?: ChainedActionOptions) => action(value, { ...options, noDispatch: true })
      ]
    })
  ) as ChainedActions

  /**
   * Returns the current slice state.
   */
  const getSlice = () => {
    return GlobalStore.getInstance().getSlice<Slice>(key)
  }

  /**
   * Replaces the slice state and optionally emits an update event.
   * @param state The new state.
   * @param options.emit Whether to emit an update event (default: true).
   */
  const replaceSlice = (state: Slice, { emit = true } = {}) => {
    const newSlice = GlobalStore.getInstance().replaceSlice(key, state)
    emit && EventEmitter.getInstance().dispatch(key, newSlice)
    return newSlice
  }

  /**
   * Updates the slice state and optionally emits an update event.
   * @param state The new state.
   * @param options.emit Whether to emit an update event (default: true).
   */
  const updateSlice = (state: Slice, { emit = true } = {}) => {
    const newSlice = GlobalStore.getInstance().updateSlice(key, state)
    emit && EventEmitter.getInstance().dispatch(key, newSlice)
    return newSlice
  }

  const addListener = (callback: (slice: Slice) => void) => {
    EventEmitter.getInstance().on(key, callback)
  }

  const removeListener = (callback: (slice: Slice) => void) => {
    EventEmitter.getInstance().off(key, callback)
  }

  /**
   * Chains multiple actions together and dispatches them in a single event.
   * @param batchFunction The function containing the actions to chain.
   */
  const chain = (batchFunction: (actions: ChainedActions) => void) => {
    batchFunction(chainedActions)
    dispatch()
  }

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
    __rydux_instance_ID: randomId(),
    __slice_type: {} as Slice
  }
}
