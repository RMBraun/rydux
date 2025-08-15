'use client'

import { CountReducer } from '@reducers/CountReducer'
import { useSlice } from '@rybr/rydux/client'
import { useState } from 'react'

export const CousinComponent: React.FC = () => {
  const [localState, seLocalState] = useState(0)
  const { test, cousinOnly } = useSlice(CountReducer, (slice) => ({ test: slice.test, cousinOnly: slice.cousinOnly }))

  console.log('render-CousinComponent')
  return (
    <div className={'container'}>
      <p className={'title'}>{'COUSIN COMPONENT'}</p>
      <pre>
        {JSON.stringify(
          {
            localState,
            cousinOnly,
            test
          },
          null,
          2
        )}
      </pre>
      <button
        onClick={() => {
          CountReducer.chain((actions) => {
            actions.updateText('new text-' + (localState + 1))
            actions.updateCousinOnly()
            actions.updateCousinOnly()
            actions.updateCousinOnly()
            actions.updateCousinOnly()
          })
          // CountReducer.actions.updateText('new text-' + (localState + 1))
        }}
      >
        {'CLICK ME'}
      </button>
      <button
        onClick={() => {
          seLocalState(localState + 1)
          CountReducer.actions.updateCousinOnly()
        }}
      >
        {'locale update only'}
      </button>
    </div>
  )
}
