import Rydux, { DelayedActionFunction } from 'rydux'

class Reducer {
  Rydux: typeof Rydux
  initialState: Record<string, any> | undefined
  id: string | undefined
  Actions: Record<string, any> | undefined
  DelayedActions: any

  constructor(newRydux: typeof Rydux) {
    if (newRydux) {
      this.Rydux = newRydux
    } else if (typeof window !== 'undefined') {
      this.Rydux = window.Rydux
    } else {
      throw new Error('A Rydux instance must be provided or be available via window.Rydux')
    }
  }

  init(reducerId: Reducer['id'], actions = {}, initialState = {}) {
    if (reducerId == null) {
      throw new Error('reducerId cannot be null')
    } else if (actions.constructor.name !== 'Object') {
      throw new Error('actions must be an object')
    }

    this.initialState = { ...initialState }

    this.id = reducerId

    if (this.Rydux.getStore(reducerId) == null) {
      this.Rydux.init({
        [reducerId]: initialState,
      })
    }

    this.Actions = this.Rydux.getActions(reducerId) || this.Rydux.createActions(reducerId, actions)

    this.DelayedActions =
      this.Actions &&
      Object.keys(this.Actions).reduce((acc, actionId) => {
        acc[actionId] = (payload: any) => this.Rydux.chainAction(reducerId, actionId, payload)

        return acc
      }, {} as Record<keyof typeof this.Actions, (payload: any) => void>)

    this.Rydux.setReducer(this)

    return this
  }

  reset(newState: Reducer['initialState']) {
    if (this.id && this.Rydux.getStore(this.id) !== null) {
      this.Rydux.init({
        [this.id]: newState || this.initialState,
      })
    }
  }

  getStore() {
    return this.Rydux.getStore(this.id)
  }

  batchActions(...chainedActions: Array<DelayedActionFunction>) {
    this.Rydux.callActions(chainedActions)
  }
}

export default Reducer
