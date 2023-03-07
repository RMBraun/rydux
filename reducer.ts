import Rydux, { ActionId, DelayedActionFunction, Store, StoreSlice } from './rydux'

export type ReducerId = string

type UserActionsMap = Record<string, any>

type UserActionFunction<S extends Store, T> = (store: S, payload: T) => void

type UserActionFunctions<S extends Store, UAM extends UserActionsMap> = {
  [P in keyof UAM]: UserActionFunction<S, UAM[P]>
}

type ActionFunction<T> = (payload: T) => void

type ActionFunctions<S extends Store, A extends UserActionsMap, UAFS extends UserActionFunctions<S, A>> = {
  [P in keyof UAFS]: ActionFunction<Parameters<UAFS[P]>[1]>
}

export default class Reducer<
  S extends Store = Store,
  UAM extends UserActionsMap = UserActionsMap,
  I extends keyof S = keyof S,
  UAFS extends UserActionFunctions<S, UAM> = {
    [P in keyof UAM]: (store: S, payload: UAM[P]) => void
  },
  AFS extends ActionFunctions<S, UAM, UAFS> = {
    [P in keyof UAFS]: (payload: Parameters<UAFS[P]>[1]) => void
  },
  DAFS extends ActionFunctions<S, UAM, UAFS> = {
    [P in keyof UAFS]: (payload: Parameters<UAFS[P]>[1]) => void
  }
> {
  Rydux: typeof Rydux
  initialState: S[I]
  id: I
  Actions: AFS
  DelayedActions: DAFS

  constructor(newRydux: typeof Rydux, reducerId: I, initialState = {} as S[I], actions = {} as UAFS) {
    if (newRydux) {
      this.Rydux = newRydux
    } else if (typeof window !== 'undefined') {
      this.Rydux = window.Rydux as typeof Rydux
    } else {
      throw new Error('A Rydux instance must be provided or be available via window.Rydux')
    }

    if (reducerId == null) {
      throw new Error('reducerId cannot be null')
    } else if (actions.constructor.name !== 'Object') {
      throw new Error('actions must be an object')
    }

    this.initialState = { ...initialState }

    this.id = reducerId

    if (this.Rydux.getStore(reducerId as string) == null) {
      this.Rydux.init({
        [reducerId]: initialState,
      })
    }

    this.Actions = (this.Rydux.getActions(reducerId as string) ||
      this.Rydux.createActions<S>(reducerId as string, actions)) as unknown as AFS

    this.DelayedActions = (this.Actions &&
      Object.keys(this.Actions).reduce((acc, actionId) => {
        const delayedAction = this.Rydux.createDelayedAction(reducerId as string, actionId)

        if (delayedAction) {
          acc[actionId] = delayedAction
        }

        return acc
      }, {} as Record<string, any>)) as unknown as DAFS

    this.Rydux.setReducer(this)

    return this
  }

  reset(newState: StoreSlice) {
    if (this.id && this.Rydux.getStore(this.id as string) !== null) {
      this.Rydux.init({
        [this.id]: newState || this.initialState,
      } as Store)
    }
  }

  getStore() {
    return this.Rydux.getStore(this.id as string) as S[I]
  }

  batchActions(...chainedActions: Array<DelayedActionFunction>) {
    this.Rydux.callDelayedActions(chainedActions)
  }
}
