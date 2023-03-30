import Reducer from '../Reducer'
import rydux, { type FullStore } from './rydux'

const ID = 'testStore'

export type TestStoreReducer = Reducer<FullStore, typeof ID, { testAction2: string }>

const loginReducer: TestStoreReducer = new Reducer(
  rydux,
  ID,
  {
    someValue: 'something',
  },
  {
    testAction2: ({ store, payload }) => {
      console.log(payload)
      store[ID]
    },
  }
)

export default loginReducer
