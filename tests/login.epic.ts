import Epic from '../epic'
import rydux, { type FullStore } from './rydux'

const ID = 'LoginEpic'

export type LoginEpic = Epic<FullStore, typeof ID, { superCoolLoginEpic: string; someOtherEpic: number }>

const loginEpic: LoginEpic = new Epic(rydux, ID, {
  superCoolLoginEpic: async ({ store, payload }) => {
    console.log(payload)
    store[ID]
  },
  someOtherEpic: ({ store, payload }) => {
    console.log(payload)
    store[ID]
  },
})

export default loginEpic
