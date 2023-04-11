import { Rydux } from '../../rydux'
import { type LoginReducer } from './login.reducer'
import { type TestStoreReducer } from './testStore.reducer'
import { type LoginEpic } from './login.epic'
import { type TestStoreEpic } from './testStore.epic'

export type FullStore = {
  login: {
    count: number
    username: string
    password: string
    code: string
  }
  testStore: {
    someValue: 'something'
  }
}

//@todo epics must have all unique IDs
const rydux = new Rydux<
  FullStore,
  {
    login: LoginReducer
    testStore: TestStoreReducer
  },
  [LoginEpic, TestStoreEpic]
>()

export default rydux
