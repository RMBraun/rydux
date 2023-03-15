import Rydux from './Rydux'
import Reducer from './Reducer'

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

type LoginReducer = Reducer<FullStore, 'login', { loginAction: number; test: string }>
type TestStoreReducer = Reducer<FullStore, 'testStore', { testAction2: string }>

const rydux = new Rydux<
  FullStore,
  {
    login: LoginReducer
    testStore: TestStoreReducer
  }
>()

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
    loginAction: ({ store, payload }) => {
      console.log(payload)
      store[ID]
    },
    test: ({ store, payload }) => {
      console.log(payload)
      store[ID]
    },
  }
)

const Actions = loginReducer.Actions
const id = loginReducer.id
const testActions = loginReducer.Actions.test('test')

const ActionFunctions = loginReducer.Actions.loginAction(333)
const DelayedActionFunctions = loginReducer.DelayedActions.test('test string')

const StoreSlice = loginReducer.getStore()
const initState = loginReducer.initialState

//------------
//  tests
//------------

//----- getReducers
const getReducersTest = rydux.getReducers()

//----- getReducer
const getReducerTest = rydux.getReducer('login')

//----- initReducer
const initReducerTest = rydux.initReducer(
  {
    code: 'test',
    password: 'test',
    username: 'test',
  },
  loginReducer
)

//----- removeReducer
const removeReducerTest = rydux.removeReducer('login')

//----- getEventEmitter
const eventEmittersTest = rydux.getEventEmitter()

//----- getStores - full store
const fullStoreTest = rydux.getStores()

//----- getStore - specific

const specificStoreTest = rydux.getStore('login')

//----- getActions - all actions
const getActionsTest = rydux.getActions()

//----- getAction = specific actions
const specificActionsTest1 = rydux.getAction('login')
const specificActionsTest2 = rydux.getAction('testStore')

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----

//-----
