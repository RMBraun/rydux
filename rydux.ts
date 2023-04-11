import EE from 'eventemitter3'
import { produce } from 'immer'
import { type Reducer } from './reducer'
import { EVENTS, TYPES } from './const'
import { type Epic } from './epic'

type Key = string | number | symbol

export type ReactComponentProps = Record<string, unknown>

export type StoreSlice = Record<string, unknown>

export type Store = Record<string, StoreSlice>

export type PickerFunction<
  S extends Store = Store,
  P extends ReactComponentProps = ReactComponentProps,
  R extends ReactComponentProps = ReactComponentProps
> = (store: S, props: P) => R

export type ChangeListenerFunction<S extends Store = Store> = (store: S) => void

export type ActionId = Key

export type EpicId = Key

export type PayloadTypeMap = Record<Key, any>

export type UserActionFunction<S extends Store, I extends keyof S, T> = (
  props: { store: S; slice: S[I] },
  payload: T
) => void

export type UserActionFunctions<S extends Store, I extends keyof S, PTM extends PayloadTypeMap> = {
  [P in keyof PTM]-?: UserActionFunction<S, I, PTM[P]>
}

export type ActionFunction<T> = {
  type?: TYPES.ACTION | TYPES.DELAYED_ACTION
  (payload: T, isDelayed?: boolean, isLast?: boolean): void
  (payload?: T | undefined, isDelayed?: boolean, isLast?: boolean): void
}

export type ActionFunctions<PTM extends PayloadTypeMap = PayloadTypeMap> = {
  [P in keyof PTM]-?: ActionFunction<PTM[P]>
}

export type RawDelayedFunction<T> = {
  type?: TYPES
  (isLast?: boolean): void
}

export type DelayedActionFunction<T = any> = (payload: T) => RawDelayedFunction<T>

export type DelayedActionFunctions<PTM extends PayloadTypeMap> = {
  [P in keyof PTM]-?: DelayedActionFunction<PTM[P]>
}

export type UserEpicFunction<S extends Store, T> = (props: { store: S; payload: T }) => Promise<void> | void

export type UserEpicFunctions<S extends Store, PTM extends PayloadTypeMap> = {
  [P in keyof PTM]: UserEpicFunction<S, PTM[P]>
}

export type EpicFunction<T> = {
  type?: TYPES.EPIC
  (payload: T): Promise<void>
  (payload?: T | undefined): Promise<void>
}

export type EpicFunctions<PTM extends PayloadTypeMap = PayloadTypeMap> = {
  [P in keyof PTM]-?: EpicFunction<PTM[P]>
}

export type GetReducers<S extends Store = Store> = {
  [K in keyof S]: Reducer<S, keyof S, PayloadTypeMap>
}

export type GetActions<S extends Store = Store, R extends GetReducers<S> = GetReducers<S>> = {
  [K in keyof R]: R[K]['Actions']
}

export type GetEpicsArray<S extends Store = Store> = Array<Epic<S>>

export type GetEpics<S extends Store = Store, E extends GetEpicsArray<S> = GetEpicsArray<S>> = {
  [K in E[number]['id']]: Extract<E[number], Epic<S, K>>['Epics']
}

export type ChangeListener = ({
  ...props
}: {
  id: ActionId
  reducerId: string
  type: TYPES
  time: number
  payload: unknown
  store: Store
  isDelayed?: boolean
  isLast?: boolean
}) => void

export class Rydux<
  FullStore extends Store = Store,
  Reducers extends GetReducers<FullStore> = GetReducers<FullStore>,
  EpicsArray extends Array<Epic<FullStore>> = any,
  Epics extends GetEpics<FullStore, EpicsArray> = any,
  Actions extends GetActions<FullStore, Reducers> = GetActions<FullStore, Reducers>
> {
  #EventEmitter: EE
  #store: FullStore
  #reducers: Reducers
  #actions: Actions
  #epics: Epics
  #actionListeners: Map<any, ChangeListener>

  constructor(initialState = {} as Partial<FullStore>) {
    if (typeof initialState !== 'object' || initialState.constructor !== {}.constructor) {
      throw new Error(`Rydux initial state must be an object ({}) but received ${initialState?.constructor}`)
    }

    this.#actionListeners = new Map()
    this.#actions = {} as Actions
    this.#epics = {} as Epics
    this.#EventEmitter = new EE()
    this.#reducers = {} as Reducers

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

  initReducer<K extends keyof FullStore, R extends Reducers[K] = Reducers[K]>(
    initialState: FullStore[K],
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
      throw new Error(`Reducer or associated store is already initialized`)
    }

    this.#store = produce(this.#store, (draft: FullStore) => {
      Object.assign(draft, {
        [reducer.id]: initialState,
      })
    })

    this.#reducers[reducerId] = reducer

    return reducer
  }

  getReducers(): Partial<Reducers> {
    return this.#reducers
  }

  getReducer<K extends keyof FullStore>(reducerId: K): Reducers[K] | undefined {
    return !reducerId ? undefined : this.#reducers[reducerId]
  }

  removeReducer<K extends keyof FullStore>(reducerId: K): void {
    if (!reducerId) {
      return
    }

    this.#reducers = Object.fromEntries(Object.entries(this.#reducers).filter(([key]) => key !== reducerId)) as Reducers
  }

  getEventEmitter(): EE {
    return this.#EventEmitter
  }

  getStores(): Partial<FullStore> {
    return this.#store
  }

  getStore<K extends keyof FullStore>(reducerId: K): FullStore[K] | undefined {
    return this.#store[reducerId]
  }

  getAllActions(): Actions {
    return this.#actions
  }

  getReducerActions<K extends keyof FullStore, AFs extends Actions[K] = Actions[K]>(reducerId: K): AFs | undefined {
    return this.#actions[reducerId] as AFs
  }

  getEpics(): Epics {
    return this.#epics
  }

  getEpic<K extends keyof Epics>(epicId: K): Epics[K] | undefined {
    return this.#epics[epicId]
  }

  initChangeListener<P extends ReactComponentProps>(pickerFunc: PickerFunction<FullStore, P> = (store) => store) {
    const propSelectFunction: PickerFunction<FullStore, P> = (...args) => pickerFunc(...args) ?? {}
    const getInitialState = (props: P) => propSelectFunction(this.#store, props)

    return {
      propSelectFunction,
      getInitialState,
    }
  }

  addChangeListener(changeListener?: ChangeListenerFunction<FullStore>) {
    if (typeof changeListener !== 'function') {
      throw new Error('Change listener must be of type function')
    }

    this.#EventEmitter.addListener(EVENTS.UPDATE, changeListener)
  }

  removeChangeListener(changeListener?: ChangeListenerFunction<FullStore>) {
    this.#EventEmitter.removeListener(EVENTS.UPDATE, changeListener)
  }

  /**
   * Can bind to one or multiple actions for a single callback
   *
   * e.g.
   * ```
   * Redux.addActionListener([
   *   { ids: Actions.actionOne | [Actions.actionOne, Actions.actionTwo],
   *     callback: ({ id, reducerId, type, time, payload, store }) => {
   *       console.log(id, payload)
   *     }
   *   }
   * ])
   * ```
   */
  addActionListeners(
    changeListenerList: Array<{
      reducerId: keyof Reducers
      ids: keyof Actions | Array<keyof Actions>
      callback: ChangeListener
    }>
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
          ids: new Set(([] as (keyof Actions)[]).concat(listener.ids).map((id) => id.toString())),
        }))
        .forEach((listener) => {
          if (info.reducerId === listener.reducerId && listener.ids.has(info.id as string)) {
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

  createAction<T, R extends keyof FullStore = keyof FullStore, A extends keyof Actions[R] = keyof Actions[R]>(
    reducerId: R,
    actionFunction: UserActionFunction<FullStore, R, T>,
    actionId: A
  ) {
    if (typeof actionFunction !== 'function') {
      throw new Error(`Action function must be of type function. Instead got ${typeof actionFunction}`)
    }

    if (!actionId) {
      throw new Error('ActionId cannot be empty')
    }

    const thisRef = this

    const action = function (payload: T, isDelayed = false, isLast = false) {
      thisRef.#EventEmitter.emit(EVENTS.ACTION, () => {
        //get new store
        const newStore = produce(thisRef.#store, (draft: FullStore) =>
          actionFunction({ store: draft, slice: draft[reducerId] }, payload)
        )

        //update global store
        thisRef.#store = newStore

        //send new action log to listeners
        thisRef.#EventEmitter.emit(EVENTS.ACTION_LISTENER, {
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
          thisRef.#EventEmitter.emit(EVENTS.UPDATE, newStore)
        }
      })
    } as ActionFunction<T>

    //add prototype toString so that it resolves to the actionId
    action.type = TYPES.ACTION
    action.toString = () => actionId as string
    action.prototype.toString = () => actionId

    //snapshot action
    this.#actions[reducerId] = this.#actions[reducerId] || {}

    if (this.#actions[reducerId][actionId] == null) {
      this.#actions[reducerId][actionId] = action as Actions[R][A]
    } else {
      throw new Error(`An Action with the name ${actionId as string} already exists for reducer ${reducerId as string}`)
    }

    return action
  }

  createActions<PTM extends PayloadTypeMap, R extends keyof FullStore = keyof FullStore>(
    reducerId?: R,
    actions = {} as UserActionFunctions<FullStore, R, PTM>
  ) {
    if (typeof reducerId !== 'string') {
      throw new Error(`You must specify a non-null String reducerId when creating rydux actions`)
    }
    if (actions.constructor.name !== 'Object') {
      throw new Error('actions must be an Object')
    }

    return Object.keys(actions).reduce((acc, actionId: keyof PTM) => {
      acc[actionId] = this.createAction<PTM[typeof actionId], R>(reducerId, actions[actionId], actionId as string)

      return acc
    }, {} as ActionFunctions<PTM>)
  }

  createEpicFunction<T, R extends keyof Epics = keyof Epics, A extends keyof Epics[R] = keyof Epics[R]>(
    epicId: R,
    epicFunction: UserEpicFunction<FullStore, T>,
    actionId: A
  ) {
    if (typeof epicFunction !== 'function') {
      throw new Error(`Epic func must be of type function. Instead got ${typeof epicFunction}`)
    }

    if (!epicId) {
      throw new Error('EpicId cannot be empty')
    }

    const thisRef = this

    const epic = async function (payload: T) {
      return new Promise<void>((res) => {
        thisRef.#EventEmitter.emit(EVENTS.ACTION, async () => {
          //send new action log to listeners
          thisRef.#EventEmitter.emit(EVENTS.ACTION_LISTENER, {
            id: actionId,
            epicId,
            type: TYPES.EPIC,
            time: Date.now(),
            payload,
            store: thisRef.#store,
          })

          await epicFunction({ store: thisRef.#store, payload })

          res()
        })
      })
    } as EpicFunction<T>

    //add prototype toString so that it resolves to the actionId
    epic.type = TYPES.EPIC
    epic.toString = () => actionId as string
    epic.prototype.toString = () => actionId

    //snapshot epic
    this.#epics[epicId] = this.#epics[epicId] || ({} as Epics[typeof epicId])

    if (this.#epics[epicId][actionId] == null) {
      this.#epics[epicId][actionId] = epic as Epics[R][A]
    } else {
      throw new Error(`An Epic with the name ${actionId as string} already exists for reducer ${epicId as string}`)
    }

    return epic
  }

  createEpicFunctions<PTM extends PayloadTypeMap>(
    epicId: keyof Epics,
    epics = {} as UserEpicFunctions<FullStore, PTM>
  ) {
    if (epicId == null) {
      throw new Error(`You must specify a non-null epicId when creating epics`)
    }

    return Object.keys(epics).reduce((acc, actionId: keyof PTM) => {
      acc[epicId] = this.createEpicFunction<PTM[typeof actionId]>(epicId, epics[actionId], actionId as string)

      return acc
    }, {} as EpicFunctions<PTM>)
  }

  createDelayedAction<T, K extends keyof FullStore = keyof FullStore>(reducerId: K, actionId: keyof Actions[K]) {
    const action = this.#actions?.[reducerId]?.[actionId]

    if (typeof action !== 'function' || action.type !== TYPES.ACTION) {
      console.warn(`The action ${actionId as string} is not a function for reducer ${reducerId as string}`)
      return
    }

    const delayedAction = function (payload: T) {
      const func = (isLast = false) => action(payload, true, isLast)
      func.type = TYPES.DELAYED_ACTION
      return func
    } as DelayedActionFunction<T>

    return delayedAction
  }

  callAction<K extends keyof Reducers, I extends keyof Actions>(
    reducerId: K,
    actionId: I,
    payload: Parameters<Actions[K][I]>[0]
  ) {
    const action = this.#actions?.[reducerId]?.[actionId as string]

    if (typeof action !== 'function' || action.type !== TYPES.ACTION) {
      throw new Error(`The action ${actionId as string} is not a function for reducer ${reducerId as string}`)
    }

    action(payload)
  }

  callEpic<K extends keyof Epics, I extends keyof Epics[K]>(
    epicId: K,
    actionId: I,
    payload: Parameters<Epics[K][I]>[0]
  ) {
    const epic = this.#epics?.[epicId]?.[actionId]

    if (typeof epic !== 'function' || epic.type !== TYPES.EPIC) {
      throw new Error(`The epic ${actionId as string} is not a function for reducer ${epicId as string}`)
    }

    return epic(payload)
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
