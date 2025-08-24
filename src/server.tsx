import React, { PropsWithChildren } from 'react'
import 'server-only'
import { type Reducer } from './index.js'
import { SerializeSliceToClient } from './SerializeSliceToClient.js'

/**
 * Server and client components update in separate environments.
 * This will create a client boundary and serialize the given state to the client.
 * This is used to ensure that the slice state is available on the client side.
 */
export function UpdateSlice<R extends Reducer>({
  reducer,
  state,
  replace = false,
  children
}: PropsWithChildren<{
  reducer: R
  state: R['__slice_type']
  replace?: boolean
}>): React.JSX.Element {
  if (replace) {
    reducer.replaceSlice(state)
  } else {
    reducer.updateSlice(state)
  }

  return (
    <SerializeSliceToClient
      reducer={reducer}
      state={state}
      replace={replace}
    >
      {children}
    </SerializeSliceToClient>
  )
}
