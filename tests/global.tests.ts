import LoginReducer from './login.reducer'

console.log(LoginReducer.getStore().count)

for (let i = 0; i < 100; i++) {
  LoginReducer.Actions.incCount()
  LoginReducer.Actions.loginAction(4)
  LoginReducer.Actions.testAction()

  console.log(LoginReducer.getStore().count)
}
