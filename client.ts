import { useEffect, useState } from 'react'
import { type Reducer } from '.'
import { EventEmitter } from './event-emitter'
import { GlobalStore } from './global-store'
import { shallowCompareAreEqual } from './utils'

export function useSlice<R extends Reducer, S extends R['__slice_type'], O extends unknown = S>(
  reducer: R,
  pickFunction: (slice: S) => O = (slice: S) => slice as unknown as O
) {
  const [state, setState] = useState(() => pickFunction(GlobalStore.getSlice<S>(reducer.key)))

  useEffect(() => {
    const handleUpdate = (newSlice: S) => {
      setState((prevState) => {
        const newState = pickFunction(newSlice)

        if (shallowCompareAreEqual(newState, prevState)) {
          return prevState
        }

        return newState
      })
    }

    EventEmitter.on(reducer.key, handleUpdate)

    return () => {
      EventEmitter.off(reducer.key, handleUpdate)
    }
  }, [setState])

  return state
}
