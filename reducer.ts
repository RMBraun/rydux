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
  UAFM extends UserActionFunctionsMap = UserActionFunctionsMap,
  I extends keyof S = keyof S,
  UAFs extends UserActionFunctions<S, UAFM> = UserActionFunctions<S, UAFM>,
  AFs extends ActionFunctions<S, UAFM, UAFs> = ActionFunctions<S, UAFM, UAFs>,
  DAFs extends DelayedActionFunctions<S, UAFM, UAFs> = DelayedActionFunctions<S, UAFM, UAFs>
> {
  Rydux: typeof Rydux
  initialState: S[I]
  id: ReducerId
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

    if (reducerId == null) {
      throw new Error('reducerId cannot be null')
    } else if (actions.constructor.name !== 'Object') {
      throw new Error('actions must be an object')
    }

    this.initialState = { ...initialState }

    this.id = reducerId as string

    if (this.Rydux.getStore(this.id) == null) {
      this.Rydux.init({
        [this.id]: initialState,
      })
    }

    this.Actions =
      this.Rydux.getActions<string, AFs>(this.id) || this.Rydux.createActions<S, UAFM, UAFs, AFs>(this.id, actions)

    this.DelayedActions = (this.Actions &&
      Object.keys(this.Actions).reduce((acc, actionId) => {
        const type = this.Actions[actionId]
        const delayedAction = this.Rydux.createDelayedAction<typeof type>(this.id, actionId)

        if (delayedAction) {
          acc[actionId] = delayedAction
        }

        return acc
      }, {} as Record<string, any>)) as unknown as DAFs

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

  batchActions(...chainedActions: Array<RawDelayedFunction>) {
    this.Rydux.callDelayedActions(chainedActions)
  }
}
