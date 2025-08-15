'use client'

import React, { PropsWithChildren, useRef } from 'react'
import { GlobalStore, SliceState } from './global-store'

/**
 * Create a client boundary and serialize the given state to the client.
 * This component is used to ensure that the slice state is available on the client side.
 */
export const SerializeSliceToClient: React.FC<
  PropsWithChildren<{
    reducerKey: string
    state: SliceState
    replace?: boolean
  }>
> = ({ reducerKey, state, replace = false, children }) => {
  const hasRun = useRef(false)

  if (!hasRun.current) {
    hasRun.current = true

    if (!GlobalStore.hasSlice(reducerKey)) {
      GlobalStore.createSlice(reducerKey, state)
    } else {
      if (replace) {
        GlobalStore.replaceSlice(reducerKey, state)
      } else {
        GlobalStore.updateSlice(reducerKey, state)
      }
    }
  }

  return <>{children}</>
}
