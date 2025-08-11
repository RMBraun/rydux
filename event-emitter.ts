import EE from 'eventemitter3'
import { WINDOW_GLOBAL_EE_KEY, WINDOW_GLOBAL_EVENT_EMITTER_KEY } from './constants'
import { SliceState } from './global-store'

export class EventEmitter {
  static #instance: EventEmitter
  #eventEmitter!: EE

  static #getInstance() {
    if (!EventEmitter.#instance) {
      EventEmitter.#instance =
        typeof window !== 'undefined'
          ? (window[WINDOW_GLOBAL_EVENT_EMITTER_KEY] = new EventEmitter())
          : (global[WINDOW_GLOBAL_EVENT_EMITTER_KEY] = new EventEmitter())
    }

    if (!EventEmitter.#instance.#eventEmitter) {
      EventEmitter.#instance.#eventEmitter =
        typeof window !== 'undefined'
          ? (window[WINDOW_GLOBAL_EE_KEY] = new EE())
          : (global[WINDOW_GLOBAL_EE_KEY] = new EE())
    }

    return EventEmitter.#instance
  }

  static dispatch(key: string, slice: SliceState) {
    EventEmitter.#getInstance().#eventEmitter.emit(key, slice)
  }

  static on<S extends SliceState>(key: string, callback: (slice: S) => void) {
    EventEmitter.#getInstance().#eventEmitter.on(key, callback)
  }

  static off<S extends SliceState>(key: string, callback: (slice: S) => void) {
    EventEmitter.#getInstance().#eventEmitter.off(key, callback)
  }
}
