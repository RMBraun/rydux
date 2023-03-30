import LoginReducer from './login.reducer'

const Actions = LoginReducer.Actions
const id = LoginReducer.id
const testAction = LoginReducer.Actions.testAction()

const loginAction = LoginReducer.Actions.loginAction(333)
const delayedTestAction = LoginReducer.DelayedActions.testAction(undefined)

const StoreSlice = LoginReducer.getStore()
const initState = LoginReducer.initialState
