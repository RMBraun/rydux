import rydux, { FullStore } from './rydux'
import { createListener } from 'rydux'

export default createListener<FullStore>(rydux)
