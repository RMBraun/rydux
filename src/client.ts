import { useEffect, useState } from 'react'
import { SliceState, type Reducer } from './index.js'
import { shallowCompareAreEqual } from './utils.js'

export function useSlice<R extends Reducer, S extends R['__slice_type'], O extends unknown = S>(
  reducer: R,
  pickFunction: (slice: S) => O = (slice: S) => slice as unknown as O
) {
  const [state, setState] = useState(() => pickFunction(reducer.getSlice() as S))

  useEffect(() => {
    const handleUpdate = (newSlice: S | SliceState) => {
      setState((prevState) => {
        const newState = pickFunction(newSlice as S)

        if (shallowCompareAreEqual(newState, prevState)) {
          return prevState
        }

        return newState
      })
    }

    reducer.addListener(handleUpdate)

    return () => {
      reducer.removeListener(handleUpdate)
    }
  }, [setState, pickFunction])

  return state
}
