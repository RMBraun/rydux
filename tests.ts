import Rydux from './rydux'
import Reducer from './reducer'

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

type LoginReducer = Reducer<FullStore, 'login', { testAction: number; test: string }>
type TestStoreReducer = Reducer<FullStore, 'testStore', { testAction2: string }>

const rydux = new Rydux<
  FullStore,
  {
    login: LoginReducer
    testStore: TestStoreReducer
  }
>()

const testReducers = rydux.getReducers()
const testStoreReducer = rydux.getReducer('login')

const ID = 'login'

const loginReducer: LoginReducer = new Reducer(
  rydux,
  'login',
  {
    username: '',
    password: '',
    code: '',
  },
  {
    testAction: (store, payload) => {
      console.log(payload)
      store[ID]
    },
    test: (store, payload) => {
      console.log(payload)
      store[ID]
    },
  }
)

const Actions = loginReducer.Actions
const id = loginReducer.id
const test = loginReducer.Actions.test('test')

const ActionFunctions = loginReducer.Actions.testAction(333)
const DelayedActionFunctions = loginReducer.DelayedActions.test('test string')

const StoreSlice = loginReducer.getStore()
const initState = loginReducer.initialState

rydux.initReducer(
  'login',
  {
    code: 'test',
    password: 'test',
    username: 'test',
  },
  loginReducer
)
