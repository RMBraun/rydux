'use client'

import { CountReducer } from '@reducers/CountReducer'
import { useSlice } from '@rybr/rydux/client'
import { useState } from 'react'

export const MainComponent: React.FC = () => {
  const [testLocal, setTestLocal] = useState(0)

  const { count, test } = useSlice(CountReducer, (slice) => ({ count: slice.count, test: slice.test }))

  console.log('render-MainComponen.tsx')

  return (
    <div className={'container'}>
      <p className={'title'}>{'MAIN COMPONENT'}</p>
      <p>count: {count}</p>
      <p>state test: {test}</p>
      <p>state test2: {testLocal}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <button
          onClick={() => {
            setTestLocal(testLocal + 1)
            CountReducer.actions.updateCount()
            CountReducer.actions.updateCount()
            CountReducer.actions.updateText(`updated!`)
          }}
        >
          {`CLICK ME`}
        </button>
        <button
          onClick={() => {
            console.log('trying to set count to 500 directly')
            CountReducer.getSlice().count = 500
          }}
        >
          {'Modify state directly - should NOT work'}
        </button>
      </div>
    </div>
  )
}
