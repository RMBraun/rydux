import { Immutable, produce } from 'immer'

export const shallowCompareAreEqual = (a: unknown, b: unknown) => {
  if (typeof a !== 'object' || a == null || typeof b !== 'object' || b == null) {
    return a === b
  }

  return !Object.keys(a).some(
    (key) => !(key in b) || (a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]
  )
}

export const toImmutable = <T extends unknown>(input: T): Immutable<T> => produce<T>(input, () => {}) as Immutable<T>

export const randomId = () => {
  return Math.random().toString(36).substring(2, 15)
}
