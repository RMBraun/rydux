import { createElement, FC, forwardRef, memo, useEffect, useState } from 'react'
import { type Rydux } from './rydux'
import { type PickerFunction, type ReactComponentProps, type ChangeListenerFunction, Store } from './rydux'

export const createListener = <S extends Store, R extends Rydux<S> = Rydux<S>>(rydux: R) => {
  return function listen<Props extends ReactComponentProps, StoreProps extends ReactComponentProps>(
    pickerFunc: PickerFunction<S, Props, StoreProps>,
    Component: FC<Props & StoreProps>
  ) {
    if (rydux == null) {
      throw new Error("No Redux bound to this listener. Please call 'bindRedux'")
    }

    const { getInitialState, propSelectFunction } = rydux.initChangeListener<Props>(pickerFunc)

    //TODO remove memo? This is causing shallow compares to prevent re-rendering
    const MemoizedComponent = memo(Component as unknown as FC<Props>)

    let isUnmounted = false

    return forwardRef<unknown, Props>(function ReduxWrapper(props, forwardedRef) {
      const [state, setState] = useState(getInitialState({ ...props }))

      useEffect(() => {
        isUnmounted = false

        var propListener: ChangeListenerFunction<S> | undefined =
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

          rydux.addChangeListener(propListener)
        }

        return () => {
          isUnmounted = true
          rydux.removeChangeListener(propListener)
        }
      }, [])

      return createElement(MemoizedComponent, {
        ref: forwardedRef,
        ...{
          ...state,
          ...props,
        },
      })
    })
  }
}
