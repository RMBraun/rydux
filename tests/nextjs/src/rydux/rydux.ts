import { Rydux } from '@rybr/rydux'
import { type TestReducer } from './test.reducer'
import { type LoginEpic } from './login.epic'

export type FullStore = {
  test: {
    [id: number]: number
  }
}

//@todo epics must have all unique IDs
const rydux = new Rydux<
  FullStore,
  {
    test: TestReducer
  },
  [LoginEpic]
>()

export default rydux
