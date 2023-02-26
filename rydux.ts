declare global {
  interface Window {
    Rydux: typeof Rydux
  }
}

import EE from 'eventemitter3'
import { produce } from 'immer'
import Reducer from 'reducer'

import { EVENTS, TYPES } from './const'

type ReactComponentProps = Record<string, unknown>

type ReducerId = NonNullable<Reducer['id']>

type StoreSlice = Record<string, unknown>

type Store = Record<ReducerId, StoreSlice>

type PickerFunction = (store: Store, props?: ReactComponentProps) => Store

type ChangeListenerFunction = (...args: any) => void

type ActionId = string

type EpicId = string

type UserActionFunction = (store: Store, payload: unknown) => void

type RawActionFunction = (payload: unknown, isDelayed?: boolean, isLast?: boolean) => void

type ActionFunction = {
  type: TYPES
} & RawActionFunction

export type DelayedActionFunction = {
  type: TYPES
} & ((isLast?: boolean) => void)

type UserEpicFunction = (store: Store, payload: unknown) => void

type RawEpicFunction = (payload: unknown) => void

type EpicFunction = {
  type: TYPES
} & RawEpicFunction

class Rydux {
  //class properties type declarations
  #EventEmitter: EE
  #store: Store
  #actionListeners: Map<any, any>
  #actions: Record<ReducerId, Record<ActionId, ActionFunction>>
  #epics: Record<ReducerId, Record<ActionId, EpicFunction>>
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

  static initChangeListener(pickerFunc: PickerFunction = (store) => store) {
    const propSelectFunction: PickerFunction = (...args) => pickerFunc(...args) ?? {}
    const getInitialState = (props: ReactComponentProps) => propSelectFunction(Rydux.#getInstance().#store, props)

    return {
      propSelectFunction,
      getInitialState,
    }
  }

  static addChangeListener(changeListener?: ChangeListenerFunction) {
    if (typeof changeListener === 'function') {
      Rydux.#getInstance().#EventEmitter.addListener(EVENTS.UPDATE, changeListener)
    } else {
      throw new Error('Change listener must be of type function')
    }
  }

  static removeChangeListener(changeListener?: ChangeListenerFunction) {
    Rydux.#getInstance().#EventEmitter.removeListener(EVENTS.UPDATE, changeListener)
  }

  /*
  example usages:
  import { Actions } from './myRedux'

  Redux.addActionListener(function ({ id, storeId, type, time, payload, prevStore, store }) {
    if(id === Actions.actionOne.toString()) {
        console.log(id, payload)
    }
  })

  //listen for Redux Actions and Epics
  Redux.addActionListener({
    [Actions.actionOne]: ({ id, storeId, type, time, payload, prevStore, store }) => {
      console.log(id, payload)
    }
  })

  //can bind to multiple actions for a single callback
  Redux.addActionListener([
    { ids: [Actions.actionOne, Actions.actionTwo], 
      callback: ({ id, storeId, type, time, payload, prevStore, store }) => {
        console.log(id, payload)
      }
    }
  ])
  
  static addActionListener(changeListener) {
    const type = changeListener?.constructor?.name

    if (type === Function.name) {
      Rydux.#getInstance().#EventEmitter.addListener(EVENTS.ACTION_LISTENER, changeListener)
    } else if (type === Object.name) {
      Object.entries(changeListener).forEach(([key, callback]) => {
        if (callback == null) {
          throw new Error(`Action listener for ${key} cannot be null`)
        }

        if (typeof callback !== 'function') {
          throw new Error(`Action listener for ${key} must be a Function`)
        }

        if (typeof key !== 'string') {
          throw new Error('All action listener keys must be Strings')
        }
      })

      const actionListenerMapFunc = (info) => {
        const listenerForId = changeListener[info.id]
        if (listenerForId) {
          listenerForId(info)
        }
      }

      Rydux.#getInstance().#actionListeners.set(changeListener, actionListenerMapFunc)

      Rydux.#getInstance().#EventEmitter.addListener(EVENTS.ACTION_LISTENER, actionListenerMapFunc)
    } else if (type === Array.name) {
      changeListener.forEach((listener, i) => {
        if (listener == null) {
          throw new Error(`Action listener at index ${i} cannot be null`)
        }

        if (!Array.isArray(listener.ids)) {
          throw new Error(`Action listener id list at index ${i} must be an array`)
        }

        if (listener.ids.length === 0) {
          throw new Error(`Action listener id list at index ${i} must contain at least 1 id`)
        }

        if (
          listener.callback == null ||
          (listener.callback.constructor && listener.callback.constructor.name !== Function.name)
        ) {
          throw new Error(`Action listener callback at index ${i} must be a function`)
        }
      })

      //in case they use the Action function directly as the ID rather than the string ID
      const formattedChangeListener = changeListener.map((listener) => ({
        ...listener,
        ids: listener.ids.map((id) => id.toString()),
      }))

      const actionListenerMapFunc = (info) => {
        formattedChangeListener.forEach(({ ids, callback }) => {
          if (ids.includes(info.id)) {
            callback(info)
          }
        })
      }

      Rydux.#getInstance().#actionListeners.set(changeListener, actionListenerMapFunc)

      Rydux.#getInstance().#EventEmitter.addListener(EVENTS.ACTION_LISTENER, actionListenerMapFunc)
    } else {
      throw new Error('Action listener must be of type function, object, or array')
    }
  }

  static removeActionListener(changeListener) {
    if (Rydux.#getInstance().#actionListeners.has(changeListener)) {
      Rydux.#getInstance().#EventEmitter.removeListener(
        EVENTS.ACTION_LISTENER,
        Rydux.#getInstance().#actionListeners.get(changeListener)
      )

      Rydux.#getInstance().#actionListeners.delete(changeListener)
    }
  }
 */

  static createAction(reducerId: ReducerId, actionFunction: UserActionFunction, actionName = '') {
    if (typeof actionFunction !== 'function') {
      throw new Error(`Action function must be of type function. Instead got ${typeof actionFunction}`)
    }

    const actionId: ActionId = actionFunction.name || actionName

    const rawAction: RawActionFunction = function (payload: unknown, isDelayed = false, isLast = false) {
      //get new store
      const newStore: Store = produce(Rydux.#getInstance().#store, (draft) => actionFunction(draft, payload))
      Rydux.#getInstance().#store = newStore

      //send new action log to listeners
      Rydux.#getInstance().#EventEmitter.emit(EVENTS.ACTION_LISTENER, {
        id: actionId,
        storeId: reducerId,
        type: TYPES.ACTION,
        time: Date.now(),
        payload,
        prevStore: newStore, //TODO remove diff
        store: newStore,
        isDelayed: !!isDelayed,
        isLast,
      })

      if (!isDelayed) {
        //notify everyone
        Rydux.#getInstance().#EventEmitter.emit(EVENTS.UPDATE, newStore)
      } else {
        //return the new store
        return newStore
      }
    }

    const action: ActionFunction = function (...props) {
      return new Promise<void>((res) => {
        Rydux.#getInstance().#EventEmitter.emit(EVENTS.ACTION, () => {
          rawAction(...props)
          res()
        })
      })
    }

    //add prototype toString so that it resolves to the actionId
    action.type = TYPES.ACTION
    action.toString = () => actionId
    action.prototype.toString = () => actionId

    //snapshot action
    Rydux.#getInstance().#actions[reducerId] = Rydux.#getInstance().#actions[reducerId] || {}

    if (Rydux.#getInstance().#actions[reducerId][actionId] == null) {
      Rydux.#getInstance().#actions[reducerId][actionId] = action
    } else {
      throw new Error(`An Action with the name ${actionId} already exists for reducer ${reducerId}`)
    }

    return action
  }

  static createActions(reducerId?: string, actions: Record<ActionId, UserActionFunction> = {}) {
    if (typeof reducerId !== 'string') {
      throw new Error(`You must specify a non-null String reducerId when creating rydux actions`)
    } else if (actions.constructor.name !== 'Object') {
      throw new Error('actions must be an Object')
    }

    return Object.fromEntries(
      Object.entries(actions).map(([actionName, func]) => [actionName, Rydux.createAction(reducerId, func, actionName)])
    )
  }

  static createEpic(reducerId: ReducerId, epicFunction: UserEpicFunction, actionName = '') {
    if (typeof epicFunction !== 'function') {
      throw new Error(`Epic func must be of type function. Instead got ${typeof epicFunction}`)
    }

    const epicId = epicFunction.name || actionName

    const rawEpic: RawEpicFunction = function (payload) {
      const store = Rydux.#getInstance().#store

      //send new action log to listeners
      Rydux.#getInstance().#EventEmitter.emit(EVENTS.ACTION_LISTENER, {
        id: epicId,
        storeId: reducerId,
        type: TYPES.EPIC,
        time: Date.now(),
        payload,
        store: store,
      })

      epicFunction(store, payload)
    }

    const epic: EpicFunction = function (...props) {
      return new Promise<void>((res) => {
        Rydux.#getInstance().#EventEmitter.emit(EVENTS.ACTION, () => {
          rawEpic(...props)
          res()
        })
      })
    }

    //add prototype toString so that it resolves to the actionId
    epic.type = TYPES.EPIC
    epic.toString = () => epicId
    epic.prototype.toString = () => epicId

    //snapshot epic
    Rydux.#getInstance().#epics[reducerId] = Rydux.#getInstance().#epics[reducerId] || {}

    if (Rydux.#getInstance().#epics[reducerId][epicId] == null) {
      Rydux.#getInstance().#epics[reducerId][epicId] = epic
    } else {
      throw new Error(`An Epic with the name ${epicId} already exists for reducer ${reducerId}`)
    }

    return epic
  }

  static createEpics(reducerId: ReducerId, epics: Record<ActionId, UserEpicFunction>) {
    if (reducerId == null) {
      throw new Error(`You must specify a non-null reducerId when creating epics`)
    }

    return Object.fromEntries(
      Object.entries(epics || {}).map(([actionName, func]) => [
        actionName,
        Rydux.createEpic(reducerId, func, actionName),
      ])
    )
  }

  static callAction(reducerId: ReducerId, actionId: ActionId, payload: unknown, { isDelayed = false } = {}) {
    const action = Rydux.#getInstance().#actions?.[reducerId]?.[actionId]

    if (typeof action !== 'function' || action.type !== TYPES.ACTION) {
      console.warn(`The action ${actionId} is not a function for reducer ${reducerId}`)
      return
    }

    if (isDelayed) {
      const delayedAction = function (isLast = false) {
        return action(payload, true, isLast)
      }

      delayedAction.type = TYPES.DELAYED_ACTION

      return delayedAction
    } else {
      action(payload)
    }
  }

  static chainAction(reducerId: ReducerId, actionId: ActionId, payload: unknown) {
    return Rydux.callAction(reducerId, actionId, payload, { isDelayed: true })
  }

  static callActions(delayedActions: Array<DelayedActionFunction>) {
    const actions = ([] as Array<DelayedActionFunction>).concat(delayedActions)

    actions.forEach((delayedAction, i) => {
      if (typeof delayedAction !== 'function' || delayedAction.type !== TYPES.DELAYED_ACTION) {
        throw new Error('Invalid Action received in CallActions. Expecting Delayed Actions only')
      }

      delayedAction(i === actions.length - 1)
    })

    //notify everyone
    Rydux.#getInstance().#EventEmitter.emit(EVENTS.UPDATE, Rydux.#getInstance().#store)
  }

  static callEpic(reducerId: ReducerId, epicId: EpicId, payload: unknown) {
    const epic = Rydux.#getInstance().#epics?.[reducerId]?.[epicId]

    if (typeof epic === 'function' && epic.type === TYPES.EPIC) {
      epic(payload)
    } else {
      console.warn(`The epic ${epicId} is not a function for reducer ${reducerId}`)
    }
  }
}

Rydux.TYPES = TYPES
Rydux.init()

//Init globally for when imported in a web browser
if (typeof window !== 'undefined') {
  window.Rydux = window.Rydux || Rydux
}

export default Rydux
