'use client'

import { Draft, Immutable, produce } from 'immer'
import React, { type PropsWithChildren, useContext, useMemo, useState, useRef } from 'react'

type Action<S> = (store: Draft<S>, value?: any) => void

const toImmutable = <T extends unknown>(input: T): Immutable<T> => produce<T>(input, () => {}) as Immutable<T>

const shallowCompareAreEqual = <O extends object>(newObj: O, oldObj: O) =>
  !(Object.keys(newObj) as Array<keyof O>).some((key) => newObj[key] !== oldObj[key])

export const createReducer = <
  S extends Record<string, unknown>,
  A extends Record<string, Action<S>>,
  Actions extends {
    [k in keyof A]: Parameters<A[k]>[1] extends undefined ? () => void : (value: Parameters<A[k]>[1]) => void
  }
>(props: {
  defaultStore: S
  actions: A
}) => {
  const context = React.createContext(
    toImmutable({
      store: props.defaultStore,
      actions: props.actions as unknown as Actions,
    })
  )

  const StoreProvider: React.FC<PropsWithChildren<{ store?: S }>> = ({ store: defaultStore, children }) => {
    const [store, setStore] = useState(defaultStore ?? props.defaultStore)

    const actions = useMemo(
      () =>
        Object.fromEntries(
          Object.entries(props.actions).map(([key, action]) => [
            key,
            (value) => setStore(produce<S>((draft) => action(draft, value))),
          ])
        ) as Actions,
      []
    )

    const value = useMemo(
      () =>
        toImmutable({
          store,
          actions,
        }),
      [store]
    )

    return <context.Provider value={value}>{children}</context.Provider>
  }

  // React context wrapper
  const useStore = <R extends object>(
    sliceFunction: (store: Immutable<S>) => Immutable<R> = (s) => s as unknown as Immutable<R>
  ) => {
    const Context = useContext(context)
    const oldSlice = useRef(Context.store as unknown as Immutable<R>)

    const slice = useMemo(() => {
      const newSlice = sliceFunction(Context.store)
      const areEqual = shallowCompareAreEqual(newSlice, oldSlice.current)

      if (areEqual) {
        console.log('are equal', newSlice, oldSlice.current)
        return oldSlice.current
      } else {
        console.log('not equal', newSlice, oldSlice.current)

        oldSlice.current = newSlice
        return oldSlice.current
      }
    }, [Context.store])

    return useMemo(
      () => ({
        ...Context,
        slice,
      }),
      [slice]
    )
  }

  return {
    context,
    StoreProvider,
    useStore,
  }
}
