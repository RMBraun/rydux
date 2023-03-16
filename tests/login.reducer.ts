import Reducer from '../Reducer'
import rydux, { type FullStore } from './rydux'

const ID = 'login'

export type LoginReducer = Reducer<FullStore, typeof ID, { loginAction: number; testAction: string }>

export const INITIAL_STATE = {
  username: '',
  password: '',
  code: '',
}

const loginReducer: LoginReducer = new Reducer(rydux, ID, INITIAL_STATE, {
  loginAction: ({ store, payload }) => {
    console.log(payload)
    store[ID]
  },
  testAction: ({ store, payload }) => {
    console.log(payload)
    store[ID]
  },
})

export default loginReducer
