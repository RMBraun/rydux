'use client'

import { Draft, produce } from 'immer'
import { GlobalStore, SliceState } from './global-store'
import { WINDOW_GLOBAL_RYDUX_KEY } from './constants'
import { EventEmitter } from './event-emitter'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { shallowCompareAreEqual } from './utils'
import React from 'react'

export class Rydux {
  static #instance: Rydux

  static #getInstance() {
    if (!Rydux.#instance) {
      Rydux.#instance = typeof window !== 'undefined' ? (window[WINDOW_GLOBAL_RYDUX_KEY] = new Rydux()) : new Rydux()
    }

    return Rydux.#instance
  }

  static dispatch(key: string, slice: SliceState) {
    EventEmitter.dispatch(key, slice)
  }

  static createReducer<
    Key extends string,
    Slice extends SliceState,
    ReducerActions extends Record<string, (slice: Draft<Slice>, value?: any) => void>
  >(
    key: Key,
    props: {
      defaultState: Slice
      actions: ReducerActions
    }
  ) {
    {
      GlobalStore.createSlice(key, props.defaultState)

      const actions = Object.fromEntries(
        Object.entries(props.actions).map(([actionName, action]) => [
          actionName,
          (value: unknown) => {
            const slice = GlobalStore.getSlice<Slice>(key)
            const newSlice = produce<Slice>(slice, (draft) => action(draft, value))

            GlobalStore.replaceSlice(key, newSlice)

            EventEmitter.dispatch(key, newSlice)
          },
        ])
      ) as {
        [k in keyof ReducerActions]: Parameters<ReducerActions[k]>[1] extends undefined
          ? () => void
          : undefined extends Parameters<ReducerActions[k]>[1]
          ? (value?: Parameters<ReducerActions[k]>[1]) => void
          : (value: Parameters<ReducerActions[k]>[1]) => void
      }

      const getSlice = () => {
        return GlobalStore.getSlice<Slice>(key)
      }

      const UpdateSliceState: React.FC<PropsWithChildren<{ state: Slice; replace?: boolean }>> = ({
        state,
        replace = false,
        children,
      }) => {
        const hasRun = useRef(false)

        if (!hasRun.current) {
          hasRun.current = true

          if (GlobalStore.hasSlice(key)) {
            if (replace) {
              GlobalStore.replaceSlice(key, state)
            } else {
              GlobalStore.mergeSlice(key, state)
            }
          } else {
            GlobalStore.createSlice(key, state)
          }
        }

        return <>{children}</>
      }

      const useSlice = <R extends unknown = Slice>(
        pickFunction: (slice: Slice) => R = (slice: Slice) => slice as unknown as R
      ) => {
        const [state, setState] = useState(() => pickFunction(GlobalStore.getSlice<Slice>(key)))

        useEffect(() => {
          const handleUpdate = (newSlice: Slice) => {
            setState((prevState) => {
              const newState = pickFunction(newSlice)

              if (shallowCompareAreEqual(newState, prevState)) {
                return prevState
              }

              return newState
            })
          }

          EventEmitter.on(key, handleUpdate)

          return () => {
            EventEmitter.off(key, handleUpdate)
          }
        }, [setState])

        return state
      }

      return {
        Reducer: {
          key,
          actions,
        },
        UpdateSliceState,
        useSlice,
        getSlice,
      }
    }
  }
}
