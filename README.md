# rydux

A minimal, event-driven global state management library for React and TypeScript.

## Features

- Global, immutable store for slices of state
- Event-driven updates using eventemitter3
- Type-safe reducer/action creation
- Works with both client and server components
- No React Context required

## Installation

```bash
npm install @rybr/rydux
```

## Usage

### 1. Create a reducer

```typescript
import { createReducer } from '@rybr/rydux'

export const CountReducer = createReducer('CountReducer', {
  defaultState: { test: 'original', count: 0, ooga: { booga: 'a' } },
  actions: {
    updateText: (slice, value: string) => {
      slice.test = `${value} - the count is: ${slice.count}`
    },
    updateCount: (slice) => {
      slice.count += 2
    }
  }
})
```

### 2. Update state from anywhere

```typescript
CountReducer.actions.updateText('Hello')
CountReducer.actions.updateCount()
```

### 3. Subscribe to state in a React component

```tsx
import { useEffect, useState } from 'react'
import { CountReducer } from './CountReducer'

function MyComponent() {
  const [state, setState] = useState(() => CountReducer.getSlice())

  useEffect(() => {
    const handleUpdate = (newState) => setState(newState)
    CountReducer.addListener(handleUpdate)
    return () => CountReducer.removeListener(handleUpdate)
  }, [])

  return <div>Count: {state.count}</div>
}
```

### 4. Server/Client Hydration

Use the provided utilities to serialize state from server to client if needed.

## API

- `createReducer(key, { defaultState, actions })` — Create a reducer and slice
- `actions` — Object of reducer actions
- `getSlice()` — Get current slice state
- `replaceSlice(state, { emit })` — Replace slice state
- `updateSlice(state, { emit })` — Merge slice state
- `addListener(callback)` — Subscribe to slice updates
- `removeListener(callback)` — Unsubscribe
- `chain(fn)` — Batch multiple actions

## License

MIT
