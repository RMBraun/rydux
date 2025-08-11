import React, { PropsWithChildren } from 'react'
import 'server-only'
import { type Reducer } from '.'
import { GlobalStore } from './global-store'
import { SerializeSliceToClient } from './SerializeSliceToClient'

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
  if (!GlobalStore.hasSlice(reducer.key)) {
    throw new Error(`Reducer with key "${reducer.key}" does not exist in the global store.`)
  } else {
    if (replace) {
      GlobalStore.replaceSlice(reducer.key, state)
    } else {
      GlobalStore.updateSlice(reducer.key, state)
    }
  }
  return (
    <SerializeSliceToClient
      reducerKey={reducer.key}
      state={state}
      replace={replace}
    >
      {children}
    </SerializeSliceToClient>
  )
}
