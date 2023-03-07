import Rydux from './rydux'
import Reducer from './reducer'

Rydux.init()

const ID = 'login'

const INITIAL_STATE = {
  username: '',
  password: '',
  code: '',
}

type FullStore = {
  login: {
    username: string
    password: string
    code: string
  }
  testStore: {
    someValue: 'something'
  }
}

type ActionFunctionTypes = { testAction: number; ooga: string }

const testReducer = new Reducer<FullStore, ActionFunctionTypes>(Rydux, 'login', INITIAL_STATE, {
  testAction: (store, payload) => {
    console.log(payload)
    store[ID]
  },
  ooga: (store, payload) => {
    console.log(payload)
    store[ID]
  },
})

const test = testReducer.Actions

type ActionFunctions = typeof testReducer.Actions
type DelayedActionFunctions = typeof testReducer.DelayedActions
