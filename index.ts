import { Draft, produce } from 'immer'
import { EventEmitter } from './event-emitter'
import { GlobalStore, SliceState } from './global-store'
import { randomId } from './utils'

export type Reducer = { key: string; __slice_type: SliceState }

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

  const actions = Object.fromEntries(
    Object.entries(props.actions).map(([actionName, action]) => [
      actionName,
      (value: unknown) => {
        const newSlice = GlobalStore.replaceSlice(
          key,
          produce(GlobalStore.getSlice<Slice>(key), (draft) => action(draft, value))
        )

        EventEmitter.dispatch(key, newSlice)
      }
    ])
  ) as {
    [k in keyof ReducerActions]: Parameters<ReducerActions[k]>[1] extends undefined
      ? () => void
      : undefined extends Parameters<ReducerActions[k]>[1]
        ? (value?: Parameters<ReducerActions[k]>[1]) => void
        : (value: Parameters<ReducerActions[k]>[1]) => void
  }

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

  return {
    key,
    actions,
    getSlice,
    replaceSlice,
    updateSlice,
    __rydux_instance_ID: randomId(),
    __slice_type: {} as Slice
  }
}
