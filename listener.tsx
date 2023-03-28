import { createElement, FC, forwardRef, memo, useEffect, useState } from 'react'
import RyduxClass, { PickerFunction, ReactComponentProps, ChangeListenerFunction } from './rydux'

var Rydux: typeof RyduxClass

if (typeof window !== 'undefined') {
  Rydux = window.Rydux
}

export const bindRedux = (newRedux: typeof RyduxClass) => {
  Rydux = newRedux
}

export function listen<T extends ReactComponentProps>(pickerFunc: PickerFunction, Component: FC<T>) {
  if (Rydux == null) {
    throw new Error("No Redux bound to this listener. Please call 'bindRedux'")
  }

  const { getInitialState, propSelectFunction } = Rydux.initChangeListener(pickerFunc)

  //TODO remove memo? This is causing shallow compares to prevent re-rendering
  const MemoizedComponent = memo(Component)

  var isUnmounted = false

  return forwardRef<unknown, T>(function ReduxWrapper(props, forwardedRef) {
    const [state, setState] = useState(getInitialState({ ...props }))

    useEffect(() => {
      isUnmounted = false

      var propListener: ChangeListenerFunction | undefined =
        typeof propListener === 'undefined' ? undefined : propListener

      if (propListener == null) {
        propListener = (newStore) => {
          //early abort if the component was unmounted or in the process of unmounting
          if (isUnmounted) {
            return
          }

          //get new state
          const newState = propSelectFunction(newStore, { ...props })

          //memo should prevent needless re-renders
          setState(newState)
        }

        Rydux.addChangeListener(propListener)
      }

      return () => {
        isUnmounted = true
        Rydux.removeChangeListener(propListener)
      }
    }, [])

    return createElement(MemoizedComponent, {
      ref: forwardedRef,
      ...state,
      ...props,
    })
  })
}
