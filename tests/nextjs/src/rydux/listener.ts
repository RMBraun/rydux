import rydux, { FullStore } from './rydux'
import { createListener } from '@rybr/rydux'

export default createListener<FullStore>(rydux)
