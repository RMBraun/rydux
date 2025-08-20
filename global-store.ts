import { produce } from 'immer'
import { WINDOW_GLOBAL_STORE_KEY } from './constants'
import { toImmutable } from './utils'

export type SliceState = Record<string, unknown>
export type Store = Record<string, SliceState>

export class GlobalStore {
  static #instance: GlobalStore
  store: Store = toImmutable({})

  static #getInstance() {
    if (!GlobalStore.#instance) {
      GlobalStore.#instance =
        typeof window !== 'undefined'
          ? (window[WINDOW_GLOBAL_STORE_KEY] = new GlobalStore())
          : (global[WINDOW_GLOBAL_STORE_KEY] = new GlobalStore())
    }

    return GlobalStore.#instance
  }

  static hasSlice(key: string) {
    const globalStore = GlobalStore.#getInstance()
    return key in globalStore.store
  }

  static createSlice<S extends SliceState>(key: string, slice: S) {
    const globalStore = GlobalStore.#getInstance()

    if (!(key in globalStore.store)) {
      globalStore.store = produce(globalStore.store, (draft) => {
        draft[key] = slice
      })
    }

    return globalStore.store[key] as S
  }

  static getSlice<S extends SliceState>(key: string): S {
    const globalStore = GlobalStore.#getInstance()

    if (!(key in globalStore.store)) {
      throw new Error(`Slice with key "${key}" does not exist in the global store.`)
    }

    return globalStore.store[key] as S
  }

  static replaceSlice<S extends SliceState>(key: string, slice: S) {
    const globalStore = GlobalStore.#getInstance()

    globalStore.store = produce(globalStore.store, (draft) => {
      draft[key] = slice
    })

    return globalStore.store[key] as S
  }

  static updateSlice<S extends SliceState>(key: string, slice: S) {
    const globalStore = GlobalStore.#getInstance()

    globalStore.store = produce(globalStore.store, (draft) => {
      draft[key] = Object.assign(draft[key], slice)
    })

    return globalStore.store[key] as S
  }
}
