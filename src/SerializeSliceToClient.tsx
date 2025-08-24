'use client'

import React, { PropsWithChildren, useRef } from 'react'
import { type Reducer, type SliceState } from './index.js'

/**
 * Create a client boundary and serialize the given state to the client.
 * This component is used to ensure that the slice state is available on the client side.
 */
export function SerializeSliceToClient<R extends Reducer>({
  reducer,
  state,
  replace = false,
  children
}: PropsWithChildren<{
  reducer: R
  state: SliceState
  replace?: boolean
}>) {
  const hasRun = useRef(false)

  if (!hasRun.current) {
    hasRun.current = true

    if (replace) {
      reducer.replaceSlice(state)
    } else {
      reducer.updateSlice(state)
    }
  }

  return <>{children}</>
}
