import Epic from '../epic2'
import rydux, { type FullStore } from './rydux'

const ID = 'TestEpic'

export type TestStoreEpic = Epic<FullStore, typeof ID, { someTestEpic: string }>

const testStoreEpic: TestStoreEpic = new Epic(rydux, ID, {
  someTestEpic: ({ store, payload }) => {
    console.log(payload)
    store[ID]
  },
})

export default testStoreEpic
