import Rydux, {
  type Store,
  type StoreSlice,
  type DelayedActionFunction,
  type RawDelayedFunction,
  type UserActionFunctionsMap,
  type UserActionFunctions,
  type ActionFunctions,
} from './rydux'

export type ReducerId = string

type DelayedActionFunctions<
  S extends Store,
  UAFM extends UserActionFunctionsMap,
  UAFs extends UserActionFunctions<S, UAFM>
> = {
  [P in keyof UAFs]: DelayedActionFunction<Parameters<UAFs[P]>[1]>
}

export default class Reducer<
  S extends Store = Store,
  I extends keyof S = keyof S,
  UAFM extends UserActionFunctionsMap = UserActionFunctionsMap,
  UAFs extends UserActionFunctions<S, UAFM> = UserActionFunctions<S, UAFM>,
  AFs extends ActionFunctions<S, UAFM, UAFs> = ActionFunctions<S, UAFM, UAFs>,
  DAFs extends DelayedActionFunctions<S, UAFM, UAFs> = DelayedActionFunctions<S, UAFM, UAFs>
> {
  Rydux: typeof Rydux
  initialState: S[I]
  id: I
  Actions: AFs
  DelayedActions: DAFs

  constructor(newRydux: typeof Rydux, reducerId: I, initialState = {} as S[I], actions = {} as UAFs) {
    if (newRydux) {
      this.Rydux = newRydux
    } else if (typeof window !== 'undefined') {
      this.Rydux = window.Rydux as typeof Rydux
    } else {
      throw new Error('A Rydux instance must be provided or be available via window.Rydux')
    }

    if (!reducerId) {
      throw new Error('reducerId cannot be empty')
    }

    if (actions.constructor.name !== 'Object') {
      throw new Error('actions must be an object of UserActionFunctions')
    }

    this.initialState = { ...initialState }

    this.id = reducerId

    if (this.Rydux.getStore(this.id as string) == null) {
      this.Rydux.init({
        [this.id]: initialState,
      })
    }

    this.Actions =
      this.Rydux.getActions<string, AFs>(this.id as string) ||
      this.Rydux.createActions<S, UAFM, UAFs, AFs>(this.id as string, actions)

    this.DelayedActions = (this.Actions &&
      Object.keys(this.Actions).reduce((acc, actionId: keyof AFs) => {
        const type = this.Actions[actionId]
        const delayedAction = this.Rydux.createDelayedAction<UAFM[keyof UAFM]>(this.id as string, actionId as string)

        if (delayedAction) {
          acc[actionId] = delayedAction
        }

        return acc
      }, {} as Record<keyof AFs, DelayedActionFunction<UAFM[keyof UAFM]>>)) as DAFs

    this.Rydux.setReducer(this as Reducer)

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

  batchActions(...chainedActions: Array<RawDelayedFunction<any>>) {
    this.Rydux.callDelayedActions(chainedActions)
  }
}
