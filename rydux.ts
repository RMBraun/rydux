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

export type ActionId = string

type EpicId = string

type UserActionFunction = (store: Store, payload: unknown) => void

type RawActionFunction = (payload: unknown, isDelayed?: boolean, isLast?: boolean) => void

export type ActionFunction = {
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

type RyduxTypes = {
  actions: Record<ReducerId, Record<ActionId, ActionFunction>>
}

type ChangeListener = ({
  ...props
}: {
  id: ActionId
  storeId: ReducerId
  type: TYPES
  time: number
  payload: unknown
  prevStore?: Store
  store: Store
  isDelayed?: boolean
  isLast?: boolean
}) => void

class Rydux {
  //class properties type declarations
  #EventEmitter: EE
  #store: Store
  #actionListeners: Map<any, ChangeListener>
  #actions: RyduxTypes['actions']
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

  static getActions<T extends ReducerId | null | undefined>(reducerId?: T) {
    return (reducerId == null ? Rydux.#getInstance().#actions : Rydux.#getInstance().#actions[reducerId]) as T extends
      | null
      | undefined
      ? RyduxTypes['actions']
      : RyduxTypes['actions'][ReducerId] | undefined
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
  */
  static addActionListener(changeListener: ChangeListener | Record<string, ChangeListener> | Array<ChangeListener>) {
    if (typeof changeListener === 'function') {
      Rydux.#getInstance().#EventEmitter.addListener(EVENTS.ACTION_LISTENER, changeListener)
    } else {
      throw new Error('changeListener must be of type function')
    }
  }

  /*
    //listen for Redux Actions and Epics
    Redux.addActionListener({
      [Actions.actionOne]: ({ id, storeId, type, time, payload, prevStore, store }) => {
        console.log(id, payload)
      }
    })
  */
  static addActionListenerMap(changeListenerMap: Record<string, ChangeListener>) {
    if (typeof changeListenerMap === 'object') {
      Object.entries(changeListenerMap).forEach(([key, callback]) => {
        if (callback == null) {
          throw new Error(`changeListener for ${key} cannot be null`)
        }

        if (typeof callback !== 'function') {
          throw new Error(`changeListener for ${key} must be a Function`)
        }

        if (typeof key !== 'string') {
          throw new Error('All changeListener keys must be Strings')
        }
      })

      const actionListenerMapFunc = (info: Parameters<ChangeListener>[0]) => {
        const listenerForId = changeListenerMap[info.id]
        if (listenerForId) {
          listenerForId(info)
        }
      }

      Rydux.#getInstance().#actionListeners.set(changeListenerMap, actionListenerMapFunc)

      Rydux.#getInstance().#EventEmitter.addListener(EVENTS.ACTION_LISTENER, actionListenerMapFunc)
    } else {
      throw new Error('Action listener must be of type Object')
    }
  }

  /*
    //can bind to multiple actions for a single callback
    Redux.addActionListener([
      { ids: [Actions.actionOne, Actions.actionTwo], 
        callback: ({ id, storeId, type, time, payload, prevStore, store }) => {
          console.log(id, payload)
        }
      }
    ]) 
   */
  static addActionListenerList(changeListenerList: Array<{ ids: Array<string>; callback: ChangeListener }>) {
    if (Array.isArray(changeListenerList)) {
      changeListenerList.forEach((listener, i) => {
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
      const formattedChangeListener = changeListenerList.map((listener) => ({
        ...listener,
        ids: listener.ids.map((id) => id.toString()),
      }))

      const actionListenerMapFunc = (info: Parameters<ChangeListener>[0]) => {
        formattedChangeListener.forEach(({ ids, callback }) => {
          if (ids.includes(info.id)) {
            callback(info)
          }
        })
      }

      Rydux.#getInstance().#actionListeners.set(changeListenerList, actionListenerMapFunc)

      Rydux.#getInstance().#EventEmitter.addListener(EVENTS.ACTION_LISTENER, actionListenerMapFunc)
    } else {
      throw new Error('Action listener must be of type array')
    }
  }

  static removeActionListener(changeListener: ChangeListener) {
    if (Rydux.#getInstance().#actionListeners.has(changeListener)) {
      Rydux.#getInstance().#EventEmitter.removeListener(
        EVENTS.ACTION_LISTENER,
        Rydux.#getInstance().#actionListeners.get(changeListener)
      )

      Rydux.#getInstance().#actionListeners.delete(changeListener)
    }
  }

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

  static createActions(reducerId?: ReducerId, actions: Record<ActionId, UserActionFunction> = {}) {
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

  static createDelayedAction(reducerId: ReducerId, actionId: ActionId) {
    const action = Rydux.#getInstance().#actions?.[reducerId]?.[actionId]

    if (typeof action !== 'function' || action.type !== TYPES.ACTION) {
      console.warn(`The action ${actionId} is not a function for reducer ${reducerId}`)
      return
    }

    const delayedAction: DelayedActionFunction = function (isLast = false) {
      return (payload: unknown) => action(payload, true, isLast)
    }

    delayedAction.type = TYPES.DELAYED_ACTION

    return delayedAction
  }

  static callAction(reducerId: ReducerId, actionId: ActionId, payload: unknown) {
    const action = Rydux.#getInstance().#actions?.[reducerId]?.[actionId]

    if (typeof action !== 'function' || action.type !== TYPES.ACTION) {
      console.warn(`The action ${actionId} is not a function for reducer ${reducerId}`)
      return
    }

    return action(payload)
  }

  static callEpic(reducerId: ReducerId, epicId: EpicId, payload: unknown) {
    const epic = Rydux.#getInstance().#epics?.[reducerId]?.[epicId]

    if (typeof epic === 'function' && epic.type === TYPES.EPIC) {
      epic(payload)
    } else {
      console.warn(`The epic ${epicId} is not a function for reducer ${reducerId}`)
    }
  }

  static callDelayedActions(delayedActions: Array<DelayedActionFunction> = []) {
    delayedActions.forEach((delayedAction, i) => {
      if (typeof delayedAction !== 'function' || delayedAction.type !== TYPES.DELAYED_ACTION) {
        throw new Error('Invalid Action received in CallActions. Expecting Delayed Actions only')
      }

      delayedAction(i === delayedActions.length - 1)
    })

    //notify everyone
    Rydux.#getInstance().#EventEmitter.emit(EVENTS.UPDATE, Rydux.#getInstance().#store)
  }
}

Rydux.TYPES = TYPES
Rydux.init()

//Init globally for when imported in a web browser
if (typeof window !== 'undefined') {
  window.Rydux = window.Rydux || Rydux
}

export default Rydux
