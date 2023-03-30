import type Rydux from './rydux'
import { type EpicFunctions, type UserEpicFunctions, type PayloadTypeMap, type Store, type EpicId } from './rydux'

export default class Epic<
  S extends Store = Store,
  I extends EpicId = EpicId,
  PTM extends PayloadTypeMap = PayloadTypeMap,
  UEFs extends UserEpicFunctions<S, PTM> = UserEpicFunctions<S, PTM>
> {
  id: I
  Epics: EpicFunctions<PTM>

  constructor(rydux: Rydux<S>, epicId: I, epics: UEFs) {
    if (!rydux) {
      throw new Error('A Rydux instance with matching store must be provided')
    }

    if (!epicId) {
      throw new Error('reducerId cannot be empty')
    }

    if (epics.constructor.name !== 'Object') {
      throw new Error('actions must be an object of UserActionFunctions')
    }

    this.id = epicId

    this.Epics = rydux.createEpicFunctions<PTM>(this.id, epics)

    return this
  }
}
