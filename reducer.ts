import type Rydux from './Rydux'
import {
  type Store,
  type DelayedActionFunction,
  type RawDelayedFunction,
  type PayloadTypeMap,
  type UserActionFunctions,
  type ActionFunctions,
  type DelayedActionFunctions,
} from './Rydux'

export type ReducerId = string

export default class Reducer<
  S extends Store = Store,
  I extends keyof S = keyof S,
  PTM extends PayloadTypeMap = PayloadTypeMap,
  UAFs extends UserActionFunctions<S, PTM> = UserActionFunctions<S, PTM>,
  DAFs extends DelayedActionFunctions<S, PTM, UAFs> = DelayedActionFunctions<S, PTM, UAFs>,
  R extends Rydux<S> = Rydux<S>
> {
  Rydux: R
  initialState: S[I]
  id: I
  Actions: ActionFunctions<S, PTM, UAFs>
  DelayedActions: DAFs

  constructor(rydux: R, reducerId: I, initialState: S[I], actions: UAFs) {
    if (rydux) {
      this.Rydux = rydux
    } else {
      throw new Error('A Rydux instance with matching store must be provided')
    }

    if (!reducerId) {
      throw new Error('reducerId cannot be empty')
    }

    if (actions.constructor.name !== 'Object') {
      throw new Error('actions must be an object of UserActionFunctions')
    }

    this.initialState = { ...initialState }

    this.id = reducerId

    this.Rydux.initReducer(initialState, this)

    this.Actions = this.Rydux.createActions<PTM, UAFs>(this.id, actions)

    this.DelayedActions =
      this.Actions &&
      Object.keys(this.Actions).reduce((acc, actionId) => {
        const delayedAction = this.Rydux.createDelayedAction(this.id, actionId)

        if (delayedAction) {
          acc[actionId as keyof DAFs] = delayedAction as DAFs[typeof actionId]
        }

        return acc
      }, {} as DAFs)

    return this
  }

  reset(newState: S[I]) {
    if (this.id && this.Rydux.getStore(this.id) !== null) {
      this.Rydux.initReducer(newState, this, true)
    }
  }

  getStore() {
    return this.Rydux.getStore(this.id) as S[I]
  }

  batchActions(...chainedActions: Array<RawDelayedFunction<any>>) {
    this.Rydux.callDelayedActions(chainedActions)
  }
}
