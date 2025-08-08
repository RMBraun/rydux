import { GlobalStore } from './global-store'
import { EventEmitter } from './event-emitter'
import EE from 'eventemitter3'
import { Rydux } from './rydux'

declare global {
  interface Window {
    __rydux__global__store_instance: GlobalStore
    __rydux__global__event_emitter_instance: EventEmitter
    __rydux__global__EE_instance: EE
    __rydux__global__rydux_instance: Rydux
  }
}
