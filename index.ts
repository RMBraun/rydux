import { Draft, produce } from 'immer'
import { EventEmitter } from './event-emitter'
import { GlobalStore, SliceState } from './global-store'
import { randomId } from './utils'

export type Reducer = { key: string; __slice_type: SliceState }

type ActionOptions = {
  /** Prevents the action from dispatching event to listeners */
  noDispatch?: boolean
}

type ChainedActionOptions = {
  noDispatch?: true
}

export const dispatch = (key: string, slice: SliceState) => {
  EventEmitter.dispatch(key, slice)
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
  if (GlobalStore.hasSlice(key)) {
    console.warn(
      `Reducer with key "${key}" already exists in the global store. ${
        props.replaceIfExists ? 'Replacing' : 'Merging with'
      } existing state.`
    )

    if (props.replaceIfExists) {
      GlobalStore.replaceSlice(key, props.defaultState)
    } else {
      GlobalStore.updateSlice(key, props.defaultState)
    }
  } else {
    GlobalStore.createSlice(key, props.defaultState)
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
        const newSlice = GlobalStore.replaceSlice(
          key,
          produce(GlobalStore.getSlice<Slice>(key), (draft) => action(draft, value))
        )

        if (!options?.noDispatch) {
          EventEmitter.dispatch(key, newSlice)
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
    return GlobalStore.getSlice<Slice>(key)
  }

  /**
   * Replaces the slice state and optionally emits an update event.
   * @param state The new state.
   * @param options.emit Whether to emit an update event (default: true).
   */
  const replaceSlice = (state: Slice, { emit = true } = {}) => {
    const newSlice = GlobalStore.replaceSlice(key, state)
    emit && EventEmitter.dispatch(key, newSlice)
    return newSlice
  }

  /**
   * Updates the slice state and optionally emits an update event.
   * @param state The new state.
   * @param options.emit Whether to emit an update event (default: true).
   */
  const updateSlice = (state: Slice, { emit = true } = {}) => {
    const newSlice = GlobalStore.updateSlice(key, state)
    emit && EventEmitter.dispatch(key, newSlice)
    return newSlice
  }

  /**
   * Dispatches the current slice state to all listeners.
   */
  const reducerDispatch = () => {
    EventEmitter.dispatch(key, GlobalStore.getSlice<Slice>(key))
  }

  /**
   * Chains multiple actions together and dispatches them in a single event.
   * @param batchFunction The function containing the actions to chain.
   */
  const chain = (batchFunction: (actions: ChainedActions) => void) => {
    batchFunction(chainedActions)
    reducerDispatch()
  }

  return {
    key,
    actions,
    getSlice,
    replaceSlice,
    updateSlice,
    dispatch: reducerDispatch,
    chain,
    __rydux_instance_ID: randomId(),
    __slice_type: {} as Slice
  }
}
