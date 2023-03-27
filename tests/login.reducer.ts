import Reducer from '../Reducer'
import rydux, { type FullStore } from './rydux'

const ID = 'login'

export type LoginReducer = Reducer<
  FullStore,
  typeof ID,
  { loginAction: number; testAction: string; incCount?: number; decCount?: number }
>

export const INITIAL_STATE = {
  count: 0,
  username: '',
  password: '',
  code: '',
}

const loginReducer: LoginReducer = new Reducer(rydux, ID, INITIAL_STATE, {
  decCount: ({ store, payload = 1 }) => {
    store[ID].count = store[ID].count - payload
  },
  incCount: ({ store, payload = 1 }) => {
    store[ID].count = store[ID].count + payload
  },
  loginAction: ({ payload }) => {
    console.log(payload)
  },
  testAction: ({ payload }) => {
    console.log(payload)
  },
})

export default loginReducer
