import EE from 'eventemitter3'
import { produce } from 'immer'
import type Reducer from './reducer'
import type { ReducerId } from './reducer'
import { EVENTS, TYPES } from './const'

export type ReactComponentProps = Record<string, unknown>

export type StoreSlice = Record<string, unknown>

export type Store = Record<ReducerId, StoreSlice>

export type PickerFunction = (store: Store, props?: ReactComponentProps) => Store

export type ChangeListenerFunction = (store: Store) => void

export type ActionId = string

export type EpicId = string

export type UserActionFunctionsMap = Record<string, any>

export type UserActionFunction<S extends Store, T> = (store: S, payload: T) => void

export type UserActionFunctions<S extends Store, UAFM extends UserActionFunctionsMap> = {
  [P in keyof UAFM]: UserActionFunction<S, UAFM[P]>
}

export type ActionFunctions<
  S extends Store = Store,
  UAFM extends UserActionFunctionsMap = UserActionFunctionsMap,
  UAFS extends UserActionFunctions<S, UAFM> = UserActionFunctions<S, UAFM>
> = {
  [P in keyof UAFS]: ActionFunction<Parameters<UAFS[P]>[1]>
}

export type RawActionFunction<T> = (payload: T, isDelayed?: boolean, isLast?: boolean) => void

export type ActionFunction<T> = {
  type?: TYPES
} & ((...a: Parameters<RawActionFunction<T>>) => Promise<ReturnType<RawActionFunction<T>>>)

export type RawDelayedFunction<T> = {
  type?: TYPES
} & ((isLast?: boolean) => Promise<ReturnType<RawActionFunction<T>>>)

export type DelayedActionFunction<T = any> = (payload: T) => RawDelayedFunction<T>

export type UserEpicFunction = (store: Store, payload: unknown) => void

export type RawEpicFunction = (payload: unknown) => void

export type EpicFunction = {
  type: TYPES
} & RawEpicFunction

export type Actions<S extends Store> = Record<keyof S, ActionFunctions>

export type Reducers<S extends Store> = {
  [P in keyof S]?: Reducer<S, P>
}

export type ChangeListener = ({
  ...props
}: {
  id: ActionId
  reducerId: ReducerId
  type: TYPES
  time: number
  payload: unknown
  store: Store
  isDelayed?: boolean
  isLast?: boolean
}) => void

export class Rydux<
  FullStore extends Store,
  ReducersMap extends Reducers<FullStore> = Reducers<FullStore>,
  ActionsMap extends Actions<FullStore> = Actions<FullStore>
> {
  #EventEmitter: EE
  #store: FullStore
  #reducers: ReducersMap
  #actions: ActionsMap

  #epics: Record<ReducerId, Record<ActionId, EpicFunction>>

  #actionListeners: Map<any, ChangeListener>

  static TYPES: typeof TYPES

  constructor(initialState = {} as Partial<FullStore>) {
    if (typeof initialState !== 'object' || initialState.constructor !== {}.constructor) {
      throw new Error(`Rydux initial state must be an object ({}) but received ${initialState?.constructor}`)
    }

    this.#actionListeners = new Map()
    this.#actions = {} as ActionsMap
    this.#epics = {}
    this.#EventEmitter = new EE()
    this.#reducers = {} as ReducersMap

    //add event listener for actions
    this.#EventEmitter.on(EVENTS.ACTION, (action: () => void) => {
      action()
    })

    //create default immer immutable store
    this.#store = produce({} as FullStore, (draft: FullStore) => {
      Object.assign(draft, initialState)
    })

    return this
  }

  initReducer<K extends keyof FullStore, S extends FullStore[K], R extends ReducersMap[K] = ReducersMap[K]>(
    initialState: S,
    reducer: R,
    allowOverride = false
  ): R {
    const reducerId = reducer?.id as K

    if (reducer?.constructor?.name !== 'Reducer') {
      throw new Error('Invalid Reducer. Must be of type Reducer with a valid non-empty ID attribute')
    }

    if (!reducerId) {
      throw new Error('Reducer Id cannot be empty')
    }

    if (initialState?.constructor?.name !== {}.constructor.name) {
      throw new Error(`Reducer initial state must be an Object ({}) but received ${typeof initialState}`)
    }

    if (!allowOverride && (this.#store[reducerId] != null || this.#reducers[reducerId] != null)) {
      throw new Error(`Reducer is already initialized`)
    }

    this.#store = produce(this.#store, (draft: FullStore) => {
      Object.assign(draft, {
        [reducer.id]: initialState,
      })
    })

    this.#reducers[reducerId] = reducer

    return reducer
  }

  //no guarantee that reducers are init yet
  getReducers(): Partial<ReducersMap> {
    return this.#reducers
  }

  //no guarantee that reducers are init yet
  getReducer<K extends keyof FullStore>(reducerId: K): ReducersMap[K] | undefined {
    return !reducerId ? undefined : this.#reducers[reducerId]
  }

  removeReducer<K extends keyof FullStore>(reducerId: K): void {
    if (!reducerId) {
      return
    }

    this.#reducers = Object.fromEntries(
      Object.entries(this.#reducers).filter(([key]) => key !== reducerId)
    ) as ReducersMap
  }

  getEventEmitter(): EE {
    return this.#EventEmitter
  }

  getStore<K extends keyof FullStore | undefined = undefined>(reducerId?: K) {
    return (reducerId == null ? this.#store : this.#store[reducerId]) as K extends keyof FullStore
      ? FullStore[K] | undefined
      : FullStore
  }

  getActions<K extends keyof FullStore | undefined = undefined>(reducerId?: K) {
    return (reducerId == null ? this.#actions : this.#actions[reducerId]) as K extends keyof FullStore
      ? ActionsMap[K] | undefined
      : ActionsMap
  }

  getEpics() {
    return this.#epics
  }

  initChangeListener(pickerFunc: PickerFunction = (store) => store) {
    const propSelectFunction: PickerFunction = (...args) => pickerFunc(...args) ?? {}
    const getInitialState = (props: ReactComponentProps) => propSelectFunction(this.#store, props)

    return {
      propSelectFunction,
      getInitialState,
    }
  }

  addChangeListener(changeListener?: ChangeListenerFunction) {
    if (typeof changeListener === 'function') {
      this.#EventEmitter.addListener(EVENTS.UPDATE, changeListener)
    } else {
      throw new Error('Change listener must be of type function')
    }
  }

  removeChangeListener(changeListener?: ChangeListenerFunction) {
    this.#EventEmitter.removeListener(EVENTS.UPDATE, changeListener)
  }

  /*
    Redux.addActionListener([  
      { ids: Actions.actionOne | [Actions.actionOne, Actions.actionTwo],   
        callback: ({ id, storeId, type, time, payload, store }) => {  
          console.log(id, payload)  
        }  
      }  
    ])   
   */
  /**
   * Can bind to one or multiple actions for a single callback
   *
   * `reducerId`: reducer this callback is bound to
   * `ids`: reducer action ID(s) this callback is bound to
   * `callback`: The callback function
   * @param changeListenerList
   */
  addActionListeners(
    changeListenerList: Array<{ reducerId: ReducerId; ids: ActionId | Array<ActionId>; callback: ChangeListener }>
  ) {
    if (!Array.isArray(changeListenerList)) {
      throw new Error('Action listener must be of type array')
    }

    changeListenerList.forEach((listener, i) => {
      if (listener == null) {
        throw new Error(`Action listener at index ${i} cannot be null`)
      }

      if (!listener.ids) {
        throw new Error(`Action listener ids list at index ${i} cannot be null`)
      }

      if (Array.isArray(listener.ids) && listener.ids.length === 0) {
        throw new Error(`Action listener ids list at index ${i} must contain at least 1 id`)
      }

      if (listener?.callback?.constructor.name !== Function.name) {
        throw new Error(`Action listener callback at index ${i} must be a function`)
      }
    })

    const actionListenerMapFunc: ChangeListener = (info) => {
      if (info?.reducerId == null || info?.id == null) {
        return
      }

      changeListenerList
        .map((listener) => ({
          ...listener,
          //in case they use the Action function directly as the ID rather than the string ID we force cast to string
          ids: new Set(([] as ActionId[]).concat(listener.ids).map((id) => id.toString())),
        }))
        .forEach((listener) => {
          if (info.reducerId === listener.reducerId && listener.ids.has(info.id)) {
            listener.callback(info)
          }
        })
    }

    this.#actionListeners.set(changeListenerList, actionListenerMapFunc)

    this.#EventEmitter.addListener(EVENTS.ACTION_LISTENER, actionListenerMapFunc)
  }

  removeActionListener(changeListener: ChangeListener) {
    if (this.#actionListeners.has(changeListener)) {
      this.#EventEmitter.removeListener(EVENTS.ACTION_LISTENER, this.#actionListeners.get(changeListener))

      this.#actionListeners.delete(changeListener)
    }
  }

  createAction<S extends FullStore, T>(
    reducerId: keyof FullStore,
    actionFunction: UserActionFunction<S, T>,
    actionName = ''
  ) {
    if (typeof actionFunction !== 'function') {
      throw new Error(`Action function must be of type function. Instead got ${typeof actionFunction}`)
    }

    const actionId: ActionId = actionFunction.name || actionName

    const rawAction: RawActionFunction<T> = (payload: T, isDelayed = false, isLast = false) => {
      //get new store
      const newStore = produce(this.#store, (draft: S) => actionFunction(draft, payload))
      this.#store = newStore

      //send new action log to listeners
      this.#EventEmitter.emit(EVENTS.ACTION_LISTENER, {
        id: actionId,
        reducerId,
        type: TYPES.ACTION,
        time: Date.now(),
        payload,
        store: newStore,
        isDelayed: !!isDelayed,
        isLast,
      })

      if (!isDelayed) {
        //notify everyone
        this.#EventEmitter.emit(EVENTS.UPDATE, newStore)
      } else {
        //return the new store
        return newStore
      }
    }

    const action: ActionFunction<T> = (...props) => {
      return new Promise<void>((res) => {
        this.#EventEmitter.emit(EVENTS.ACTION, () => {
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
    this.#actions[reducerId] = this.#actions[reducerId] || {}

    if (this.#actions[reducerId][actionId] == null) {
      //@ts-ignore
      this.#actions[reducerId][actionId] = action
    } else {
      throw new Error(`An Action with the name ${actionId} already exists for reducer ${reducerId as string}`)
    }

    return action
  }

  createActions<
    S extends FullStore,
    UAFM extends UserActionFunctionsMap,
    UAFs extends UserActionFunctions<S, UAFM> = UserActionFunctions<S, UAFM>,
    AFs extends ActionFunctions<S, UAFM, UAFs> = ActionFunctions<S, UAFM, UAFs>
  >(reducerId?: keyof FullStore, actions = {} as UAFs): AFs {
    if (typeof reducerId !== 'string') {
      throw new Error(`You must specify a non-null String reducerId when creating rydux actions`)
    } else if (actions.constructor.name !== 'Object') {
      throw new Error('actions must be an Object')
    }

    // @todo fix typing so that it's inferred
    return Object.fromEntries(
      Object.entries(actions).map(([actionName, func]) => [
        actionName,
        this.createAction<S, UAFM>(reducerId, func, actionName),
      ])
    ) as unknown as AFs
  }

  createEpic(reducerId: ReducerId, epicFunction: UserEpicFunction, actionName = '') {
    if (typeof epicFunction !== 'function') {
      throw new Error(`Epic func must be of type function. Instead got ${typeof epicFunction}`)
    }

    const epicId = epicFunction.name || actionName

    const rawEpic: RawEpicFunction = (payload) => {
      const store = this.#store

      //send new action log to listeners
      this.#EventEmitter.emit(EVENTS.ACTION_LISTENER, {
        id: epicId,
        reducerId,
        type: TYPES.EPIC,
        time: Date.now(),
        payload,
        store: store,
      })

      epicFunction(store, payload)
    }

    const epic: EpicFunction = (...props) => {
      return new Promise<void>((res) => {
        this.#EventEmitter.emit(EVENTS.ACTION, () => {
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
    this.#epics[reducerId] = this.#epics[reducerId] || {}

    if (this.#epics[reducerId][epicId] == null) {
      this.#epics[reducerId][epicId] = epic
    } else {
      throw new Error(`An Epic with the name ${epicId} already exists for reducer ${reducerId}`)
    }

    return epic
  }

  createEpics(reducerId: ReducerId, epics: Record<ActionId, UserEpicFunction>) {
    if (reducerId == null) {
      throw new Error(`You must specify a non-null reducerId when creating epics`)
    }

    return Object.fromEntries(
      Object.entries(epics || {}).map(([actionName, func]) => [
        actionName,
        this.createEpic(reducerId, func, actionName),
      ])
    )
  }

  createDelayedAction<T>(reducerId: ReducerId, actionId: ActionId) {
    const action = this.#actions?.[reducerId]?.[actionId]

    if (typeof action !== 'function' || action.type !== TYPES.ACTION) {
      console.warn(`The action ${actionId} is not a function for reducer ${reducerId}`)
      return
    }

    const delayedAction: DelayedActionFunction<T> = function (payload: T) {
      const func = (isLast = false) => action(payload, true, isLast)
      func.type = TYPES.DELAYED_ACTION
      return func
    }

    return delayedAction
  }

  callAction<T>(reducerId: ReducerId, actionId: ActionId, payload: T) {
    const action = this.#actions?.[reducerId]?.[actionId]

    if (typeof action !== 'function' || action.type !== TYPES.ACTION) {
      console.warn(`The action ${actionId} is not a function for reducer ${reducerId}`)
      return
    }

    return action(payload)
  }

  callEpic(reducerId: ReducerId, epicId: EpicId, payload: unknown) {
    const epic = this.#epics?.[reducerId]?.[epicId]

    if (typeof epic === 'function' && epic.type === TYPES.EPIC) {
      epic(payload)
    } else {
      console.warn(`The epic ${epicId} is not a function for reducer ${reducerId}`)
    }
  }

  callDelayedActions(delayedActions: Array<RawDelayedFunction<any>> = []) {
    delayedActions.forEach((delayedAction, i) => {
      if (typeof delayedAction !== 'function' || delayedAction.type !== TYPES.DELAYED_ACTION) {
        throw new Error('Invalid Action received in CallActions. Expecting Delayed Actions only')
      }

      delayedAction(i === delayedActions.length - 1)
    })

    //notify everyone
    this.#EventEmitter.emit(EVENTS.UPDATE, this.#store)
  }
}

Rydux.TYPES = TYPES

export default Rydux
