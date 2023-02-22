declare global {
  interface Window {
    Rydux: typeof Rydux
  }
}

import EE from 'eventemitter3'
import { produce } from 'immer'
import Reducer from 'reducer'

import { EVENTS, TYPES } from './const'

type ReducerId = NonNullable<Reducer['id']>

class Rydux {
  //class properties type declarations
  #EventEmitter: EE
  #store: Record<ReducerId, {}>
  #actionListeners: Map<any, any>
  #actions: Record<ReducerId, {}>
  #epics: Record<ReducerId, {}>
  #reducers: Record<ReducerId, Reducer>
  static #instance: Rydux
  static TYPES: typeof TYPES

  //class functions type declarations

  constructor() {
    this.#store = {}
    this.#actionListeners = new Map()
    this.#actions = {}
    this.#epics = {}
    this.#EventEmitter = new EE()
    this.#reducers = {}

    //add event listener for actions
    this.#EventEmitter.on(EVENTS.ACTION, (action: () => void) => {
      action()
    })
  }

  static getReducers() {
    return Rydux.#getInstance().#reducers
  }

  static getReducer(reducerId?: ReducerId) {
    return reducerId == null ? null : Rydux.#getInstance().#reducers[reducerId]
  }

  static setReducer(reducer?: Reducer) {
    if (reducer == null || reducer.id == null || reducer.constructor.name !== 'Reducer') {
      throw new Error('Invalid Reducer. Must be of type Reducer with a valid non-empty ID attribute')
    }

    Rydux.#getInstance().#reducers[reducer.id] = reducer
  }

  static removeReducer(reducerId?: ReducerId) {
    if (reducerId == null) {
      return
    }

    Rydux.#getInstance().#reducers = Object.fromEntries(
      Object.entries(Rydux.#getInstance().#reducers).filter(([key]) => key !== reducerId)
    )
  }

  static getEventEmitter() {
    return Rydux.#getInstance().#EventEmitter
  }

  static #getInstance() {
    if (Rydux.#instance == null) {
      Rydux.#instance = new Rydux()
    }

    return Rydux.#instance
  }

  static getStore(reducerId?: ReducerId) {
    const store = reducerId ? Rydux.#getInstance().#store[reducerId] : Rydux.#getInstance().#store
    return store
  }

  static getActions(reducerId?: ReducerId) {
    return reducerId == null ? Rydux.#getInstance().#actions : Rydux.#getInstance().#actions[reducerId]
  }

  static getEpics() {
    return Rydux.#getInstance().#epics
  }

  static init(initialState = {}, defaultState = {}) {
    if (typeof initialState !== 'object' || initialState.constructor !== {}.constructor) {
      throw new Error(
        `Rydux initial state must be an object ({}) but received ${initialState && initialState.constructor}`
      )
    }

    Rydux.#getInstance().#store = produce(Rydux.#getInstance().#store, (draft: any) => {
      Object.assign(draft, defaultState, initialState)
    })
  }
}

Rydux.TYPES = TYPES
Rydux.init()

//Init globally for when imported in a web browser
if (typeof window !== 'undefined') {
  window.Rydux = window.Rydux || Rydux
}

export default Rydux
