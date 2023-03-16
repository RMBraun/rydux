import Rydux from './rydux'
import LoginReducer from './login.reducer'

//----- Reducer tests
const Actions = LoginReducer.Actions
const id = LoginReducer.id
const testActions = LoginReducer.Actions.testAction('test')

const ActionFunctions = LoginReducer.Actions.loginAction(333)
const DelayedActionFunctions = LoginReducer.DelayedActions.testAction('test string')

const StoreSlice = LoginReducer.getStore()
const initState = LoginReducer.initialState

//----- getReducers
const getReducersTest = Rydux.getReducers()

//----- getReducer
const getReducerTest = Rydux.getReducer('login')

//----- initReducer
const initReducerTest = Rydux.initReducer(
  {
    code: 'test',
    password: 'test',
    username: 'test',
  },
  LoginReducer
)

//----- removeReducer
const removeReducerTest = Rydux.removeReducer('login')

//----- getEventEmitter
const eventEmittersTest = Rydux.getEventEmitter()

//----- getStores - full store
const fullStoreTest = Rydux.getStores()

//----- getStore - specific

const specificStoreTest = Rydux.getStore('login')

//----- getActions - all actions
const getActionsTest = Rydux.getAllActions()

//----- getAction - specific actions
const specificActionsTest1 = Rydux.getReducerActions('login')
const specificActionsTest2 = Rydux.getReducerActions('testStore')

//----- callAction
const specificActionsTest1Called = specificActionsTest1?.loginAction(383)

//----- getEpics - all epics
const getEpicsTest = Rydux.getEpics()

//----- getEpic - specific
const specificEpicTest1 = Rydux.getEpic('LoginEpic')
const specificEpicTest2 = Rydux.getEpic('TestEpic')

//----- callEpic
const specificEpicTest1Promise = specificEpicTest1?.someOtherEpic(34)
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
