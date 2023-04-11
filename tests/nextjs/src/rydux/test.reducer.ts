import { Reducer } from 'rydux'
import rydux, { type FullStore } from './rydux'

const ID = 'test'

export type TestReducer = Reducer<
  FullStore,
  typeof ID,
  { incCount: { id: number; offset?: number }; decCount: { id: number; offset?: number } }
>

const INITIAL_STATE: FullStore['test'] = Object.fromEntries(
  Array(100)
    .fill(null)
    .map((_, i) => [i, 0])
)

const testReducer: TestReducer = new Reducer(rydux, ID, INITIAL_STATE, {
  decCount: ({ slice }, { id, offset }) => {
    slice[id] = slice[id] - (offset ?? 1)

    //adjust adjacent
    slice[Math.max(0, id - 1)] = slice[Math.max(0, id - 1)] - (offset ?? 1)
    slice[Math.min(99, id + 1)] = slice[Math.min(99, id + 1)] - (offset ?? 1)
  },
  incCount: ({ slice }, { id, offset }) => {
    slice[id] = slice[id] + (offset ?? 1)

    //adjust adjacent
    slice[Math.max(0, id - 1)] = slice[Math.max(0, id - 1)] + (offset ?? 1)
    slice[Math.min(99, id + 1)] = slice[Math.min(99, id + 1)] + (offset ?? 1)
  },
})

export default testReducer
