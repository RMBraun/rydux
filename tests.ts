import Rydux from './Rydux'
import Reducer from './Reducer'
import Epic from './Epic'

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

//------------
//  Fake global Rydux declaration
//------------

// -- fake imports of these types from their respective files
type LoginReducer = Reducer<FullStore, 'login', { loginAction: number; testAction: string }>
type TestStoreReducer = Reducer<FullStore, 'testStore', { testAction2: string }>

type LoginEpic = Epic<FullStore, 'LoginEpic', { superCoolLoginEpic: string; someOtherEpic: number }>
type TestEpic = Epic<FullStore, 'TestEpic', { someTestEpic: string }>

const rydux = new Rydux<
  FullStore,
  {
    login: LoginReducer
    testStore: TestStoreReducer
  },
  [LoginEpic, TestEpic]
>()

//------------
//  Fake reducer creation
//------------
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
    testAction: ({ store, payload }) => {
      console.log(payload)
      store[ID]
    },
  }
)

//------------
//  tests
//------------

const Actions = loginReducer.Actions
const id = loginReducer.id
const testActions = loginReducer.Actions.testAction('test')

const ActionFunctions = loginReducer.Actions.loginAction(333)
const DelayedActionFunctions = loginReducer.DelayedActions.testAction('test string')

const StoreSlice = loginReducer.getStore()
const initState = loginReducer.initialState

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

//----- getAction - specific actions
const specificActionsTest1 = rydux.getAction('login')
const specificActionsTest2 = rydux.getAction('testStore')

//----- getEpics - all epics
const getEpicsTest = rydux.getEpics()

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
