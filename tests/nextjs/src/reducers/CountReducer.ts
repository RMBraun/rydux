import { createReducer } from '@rybr/rydux'

export const CountReducer = createReducer('CountReducer', {
  defaultState: { test: 'original', count: 0, ooga: { booga: 'a' }, cousinOnly: 0 },
  actions: {
    updateCousinOnly: (slice) => {
      slice.cousinOnly += 1
    },
    updateText: (slice, value: string) => {
      slice.test = `${value} - the count is: ${slice.count}`
    },
    updateCount: (slice) => {
      slice.count += 2
    }
  }
})
