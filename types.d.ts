import EE from 'eventemitter3'
import { EventEmitter } from './event-emitter'
import { GlobalStore } from './global-store'

declare global {
  var __rydux__global__store_instance: GlobalStore | undefined
  var __rydux__global__event_emitter_instance: EventEmitter | undefined
  var __rydux__global__EE_instance: EE | undefined
  interface Window {
    __rydux__global__store_instance: GlobalStore
    __rydux__global__event_emitter_instance: EventEmitter
    __rydux__global__EE_instance: EE
  }
}
