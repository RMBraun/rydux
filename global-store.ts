import { produce } from 'immer'
import { WINDOW_GLOBAL_STORE_KEY } from './constants'
import { toImmutable } from './utils'

export type SliceState = Record<string, unknown>
export type Store = Record<string, SliceState>

export class GlobalStore {
  static #instance: GlobalStore
  #globalStore: Store = {}

  static #getInstance() {
    if (!GlobalStore.#instance) {
      GlobalStore.#instance =
        typeof window !== 'undefined' ? (window[WINDOW_GLOBAL_STORE_KEY] = new GlobalStore()) : new GlobalStore()
    }

    return GlobalStore.#instance
  }

  static hasSlice(key: string) {
    const globalStore = GlobalStore.#getInstance()
    return key in globalStore.#globalStore
  }

  static createSlice<S extends SliceState>(key: string, slice: S) {
    const globalStore = GlobalStore.#getInstance()

    if (!(key in globalStore.#globalStore)) {
      globalStore.#globalStore[key] = toImmutable(slice)
    }

    return globalStore.#globalStore[key] as S
  }

  static getSlice<S extends SliceState>(key: string): S {
    const globalStore = GlobalStore.#getInstance()

    if (!(key in globalStore.#globalStore)) {
      throw new Error(`Slice with key "${key}" does not exist in the global store.`)
    }

    return globalStore.#globalStore[key] as S
  }

  static replaceSlice<S extends SliceState>(key: string, slice: S) {
    const globalStore = GlobalStore.#getInstance()

    globalStore.#globalStore[key] = toImmutable(slice)

    return globalStore.#globalStore[key] as S
  }

  static mergeSlice<S extends SliceState>(key: string, slice: S) {
    const globalStore = GlobalStore.#getInstance()

    globalStore.#globalStore[key] = produce(globalStore.#globalStore[key] ?? slice, (draft) => {
      Object.assign(draft, slice)
    })

    return globalStore.#globalStore[key] as S
  }
}
