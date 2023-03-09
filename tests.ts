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

const testReducer = new Reducer<FullStore, { testAction: number; test: string }>(Rydux, 'login', INITIAL_STATE, {
  testAction: (store, payload) => {
    console.log(payload)
    store[ID]
  },
  test: (store, payload) => {
    console.log(payload)
    store[ID]
  },
})

const test = testReducer.Actions.test('test')

const ActionFunctions = testReducer.Actions.testAction(333)
const DelayedActionFunctions = testReducer.DelayedActions.test('test string')
