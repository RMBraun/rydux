import EE from 'eventemitter3'
import { produce } from 'immer'
import type Reducer from './Reducer'
import { EVENTS, TYPES } from './const'
import type Epic from './Epic'

export type ReactComponentProps = Record<string, unknown>

export type StoreSlice = Record<string, unknown>

export type Store = Record<string, StoreSlice>

export type PickerFunction = (store: Store, props?: ReactComponentProps) => Store

export type ChangeListenerFunction = (store: Store) => void

export type ActionId = string

//@todo fix this typing
export type EpicId = string | number | symbol

export type PayloadTypeMap = Record<ActionId | EpicId, any>

export type UserActionFunction<S extends Store, T> = (props: { store: S; payload: T }) => void

export type UserActionFunctions<S extends Store, PTM extends PayloadTypeMap> = {
  [P in keyof PTM]: UserActionFunction<S, PTM[P]>
}

export type RawActionFunction<T> = (payload: T, isDelayed?: boolean, isLast?: boolean) => void

export type ActionFunction<T> = {
  type?: TYPES.ACTION | TYPES.DELAYED_ACTION
} & ((...a: Parameters<RawActionFunction<T>>) => ReturnType<RawActionFunction<T>>)

export type ActionFunctions<
  S extends Store = Store,
  PTM extends PayloadTypeMap = PayloadTypeMap,
  UAFS extends UserActionFunctions<S, PTM> = UserActionFunctions<S, PTM>
> = {
  [P in keyof UAFS]: ActionFunction<Parameters<UAFS[P]>[0]['payload']>
}

export type RawDelayedFunction<T> = {
  type?: TYPES
} & ((isLast?: boolean) => ReturnType<RawActionFunction<T>>)

export type DelayedActionFunction<T = any> = (payload: T) => RawDelayedFunction<T>

export type DelayedActionFunctions<
  S extends Store,
  PTM extends PayloadTypeMap,
  UAFs extends UserActionFunctions<S, PTM>
> = {
  [P in keyof UAFs]: DelayedActionFunction<Parameters<UAFs[P]>[0]['payload']>
}

export type UserEpicFunction<S extends Store, T> = (props: { store: S; payload: T }) => Promise<void> | void

export type UserEpicFunctions<S extends Store, PTM extends PayloadTypeMap> = {
  [P in keyof PTM]: UserEpicFunction<S, PTM[P]>
}

export type RawEpicFunction<T> = (payload: T) => Promise<void>

export type EpicFunction<T> = {
  type?: TYPES.EPIC
} & ((...a: Parameters<RawEpicFunction<T>>) => ReturnType<RawEpicFunction<T>>)

export type EpicFunctions<
  S extends Store = Store,
  PTM extends PayloadTypeMap = PayloadTypeMap,
  UEFs extends UserEpicFunctions<S, PTM> = UserEpicFunctions<S, PTM>
> = {
  [P in keyof UEFs]: EpicFunction<Parameters<UEFs[P]>[0]['payload']>
}

export type GetReducers<S extends Store = Store> = {
  [K in keyof S]: Reducer<S, K>
}

export type GetActions<R extends GetReducers = GetReducers> = {
  [K in keyof R]: R[K]['Actions']
}

export type GetEpicsArray<S extends Store = Store> = Array<Epic<S>>

export type GetEpics<S extends Store = Store, E extends GetEpicsArray = GetEpicsArray> = {
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
  Epics extends GetEpics<FullStore, EpicsArray> = GetEpics<FullStore, EpicsArray>,
  Actions extends GetActions<Reducers> = GetActions<Reducers>
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

  initChangeListener(pickerFunc: PickerFunction = (store) => store) {
    const propSelectFunction: PickerFunction = (...args) => pickerFunc(...args) ?? {}
    const getInitialState = (props: ReactComponentProps) => propSelectFunction(this.#store, props)

    return {
      propSelectFunction,
      getInitialState,
    }
  }

  addChangeListener(changeListener?: ChangeListenerFunction) {
    if (typeof changeListener !== 'function') {
      throw new Error('Change listener must be of type function')
    }

    this.#EventEmitter.addListener(EVENTS.UPDATE, changeListener)
  }

  removeChangeListener(changeListener?: ChangeListenerFunction) {
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
      reducerId: keyof Reducer
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

  createAction<T>(
    reducerId: keyof FullStore,
    actionFunction: UserActionFunction<FullStore, T>,
    actionId = '' as ActionId
  ) {
    if (typeof actionFunction !== 'function') {
      throw new Error(`Action function must be of type function. Instead got ${typeof actionFunction}`)
    }

    const actionName: ActionId = actionFunction.name || actionId

    const rawAction: RawActionFunction<T> = (payload: T, isDelayed = false, isLast = false) => {
      //get new store
      const newStore = produce(this.#store, (draft: FullStore) => actionFunction({ store: draft, payload }))
      this.#store = newStore

      //send new action log to listeners
      this.#EventEmitter.emit(EVENTS.ACTION_LISTENER, {
        id: actionName,
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
      this.#EventEmitter.emit(EVENTS.ACTION, () => {
        rawAction(...props)
      })
    }

    //add prototype toString so that it resolves to the actionId
    action.type = TYPES.ACTION
    action.toString = () => actionName
    action.prototype.toString = () => actionName

    //snapshot action
    this.#actions[reducerId] = this.#actions[reducerId] || {}

    if (this.#actions[reducerId][actionName] == null) {
      //@ts-ignore
      this.#actions[reducerId][actionName] = action
    } else {
      throw new Error(`An Action with the name ${actionName} already exists for reducer ${reducerId as string}`)
    }

    return action
  }

  createActions<
    PTM extends PayloadTypeMap,
    UAFs extends UserActionFunctions<FullStore, PTM> = UserActionFunctions<FullStore, PTM>
  >(reducerId?: keyof FullStore, actions = {} as UAFs) {
    if (typeof reducerId !== 'string') {
      throw new Error(`You must specify a non-null String reducerId when creating rydux actions`)
    } else if (actions.constructor.name !== 'Object') {
      throw new Error('actions must be an Object')
    }

    return Object.fromEntries(
      Object.entries(actions).map(([actionId, func]) => [
        actionId,
        this.createAction<PTM[typeof actionId]>(reducerId, func, actionId),
      ])
    ) as ActionFunctions<FullStore, PTM, UAFs>
  }

  createEpicFunction<T>(epicId: keyof Epics, epicFunction: UserEpicFunction<FullStore, T>, actionId = '') {
    if (typeof epicFunction !== 'function') {
      throw new Error(`Epic func must be of type function. Instead got ${typeof epicFunction}`)
    }

    const actionName = epicFunction.name || actionId

    const rawEpic: RawEpicFunction<T> = async (payload) => {
      const store = this.#store

      //send new action log to listeners
      this.#EventEmitter.emit(EVENTS.ACTION_LISTENER, {
        id: actionName,
        epicId,
        type: TYPES.EPIC,
        time: Date.now(),
        payload,
        store: store,
      })

      await epicFunction({ store, payload })
    }

    const epic: EpicFunction<T> = async (...props) => {
      return new Promise<void>((res) => {
        this.#EventEmitter.emit(EVENTS.ACTION, async () => {
          await rawEpic(...props)
          res()
        })
      })
    }

    //add prototype toString so that it resolves to the actionId
    epic.type = TYPES.EPIC
    epic.toString = () => actionName
    epic.prototype.toString = () => actionName

    //snapshot epic
    this.#epics[epicId] = this.#epics[epicId] || {}

    if (this.#epics[epicId][actionName] == null) {
      //@ts-ignore
      this.#epics[epicId][actionName] = epic
    } else {
      throw new Error(`An Epic with the name ${actionName} already exists for reducer ${epicId as string}`)
    }

    return epic
  }

  createEpicFunctions<
    PTM extends PayloadTypeMap,
    UEFs extends UserActionFunctions<FullStore, PTM> = UserActionFunctions<FullStore, PTM>
  >(epicId: keyof Epics, epics = {} as UEFs) {
    if (epicId == null) {
      throw new Error(`You must specify a non-null epicId when creating epics`)
    }

    return Object.fromEntries(
      Object.entries(epics).map(([actionId, func]) => [
        actionId,
        this.createEpicFunction<PTM[typeof actionId]>(epicId, func, actionId),
      ])
    ) as EpicFunctions<FullStore, PTM, UEFs>
  }

  createDelayedAction<T, K extends keyof FullStore = keyof FullStore>(reducerId: K, actionId: keyof Actions[K]) {
    const action = this.#actions?.[reducerId]?.[actionId]

    if (typeof action !== 'function' || action.type !== TYPES.ACTION) {
      console.warn(`The action ${actionId as string} is not a function for reducer ${reducerId as string}`)
      return
    }

    const delayedAction: DelayedActionFunction<T> = function (payload: T) {
      const func = (isLast = false) => action(payload, true, isLast)
      func.type = TYPES.DELAYED_ACTION
      return func
    }

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

export default Rydux
