'use client'

import { useCallback, useState } from 'react'
import { useCountStore } from './CountReducer'

export const RandomComp: React.FC = () => {
  const [state, setState] = useState(0)
  // const CountStore = useCountStore()

  console.log('render-2')
  return <button onClick={() => setState(state + 1)}>{'oh my some text here - ' + state + 'booga'}</button>
}

export const Test: React.FC = () => {
  const [test, setTest] = useState(0)
  const [test2, setTest2] = useState(0)

  const CountStore = useCountStore((store) => ({ count: store.count }))

  console.log('render-1', CountStore.store.count, CountStore.store.test)

  return (
    <div>
      {/* <p>test: {CountStore.store.test}</p> */}
      <p>count: {CountStore.slice.count}</p>
      <p>state test: {test}</p>
      <p>state test2: {test2}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <button
          onClick={() => {
            setTest(test + 1)
            setTest2(test2 + 1)
            CountStore.actions.updateCount()
            CountStore.actions.updateCount()
            CountStore.actions.updateText(`updated!`)
          }}
        >
          {`CLICK ME ${CountStore.store.count}`}
        </button>
        <button
          onClick={() => {
            CountStore.slice.count = 500
          }}
        >
          {'bad button'}
        </button>
      </div>
    </div>
  )
}
