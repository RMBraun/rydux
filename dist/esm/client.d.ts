import { SliceState, type Reducer } from './index.js';
export declare function useSlice<R extends Reducer, S extends SliceState = R['__slice_type'], O extends unknown = S>(reducer: R, pickFunction?: (slice: S) => O): O;
//# sourceMappingURL=client.d.ts.map