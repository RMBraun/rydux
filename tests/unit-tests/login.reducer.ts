import Reducer from '../Reducer'
import rydux, { type FullStore } from './rydux'

const ID = 'login'

export type LoginReducer = Reducer<
  FullStore,
  typeof ID,
  { loginAction: number; testAction?: undefined; incCount?: number; decCount?: number }
>

export const INITIAL_STATE = {
  count: 0,
  username: '',
  password: '',
  code: '',
}

const loginReducer: LoginReducer = new Reducer(rydux, ID, INITIAL_STATE, {
  decCount: ({ store, payload }) => {
    store[ID].count = store[ID].count - (payload ?? 1)
  },
  incCount: ({ store, payload }) => {
    store[ID].count = store[ID].count + (payload ?? 1)
  },
  loginAction: ({ payload }) => {
    console.log(payload)
  },
  testAction: ({ payload }) => {
    console.log(payload)
  },
})

export default loginReducer
