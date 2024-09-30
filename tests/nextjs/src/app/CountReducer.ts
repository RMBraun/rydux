'use client'

import { createReducer } from '../../../../rydux'

export const { StoreProvider: CountStoreProvider, useStore: useCountStore } = createReducer({
  defaultStore: { test: 'test', count: 0, ooga: { booga: 'a' } },
  actions: {
    updateText: (store, value: string) => {
      store.test = `${value} - the count is: ${store.count}`
    },
    updateCount: (store) => {
      store.count += 2
    },
  },
})
