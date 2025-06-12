/* eslint-disable @typescript-eslint/no-empty-object-type */
export type HasAxis<T> = T & {
    axis: number
}

export type RemoveMethod<T> = T extends number | number[]
    ? 'sum' | 'mean' | 'max' | 'min' | 'median' | 'first' | 'last'
    : T extends string
      ? 'concat' | 'first' | 'last'
      : T extends boolean
        ? 'and' | 'or' | 'first' | 'last'
        : never
/** Options to specify an axis for vectorized operations */
export interface AxisOptions {
    axis?: number
}
/** Apply mapping over sub-vectors along an axis */
export interface MapOptions extends AxisOptions {}
/** Apply reduction over sub-vectors along an axis */
export interface ReduceOptions extends AxisOptions {}
/** Sum elements along an axis */
export interface SumOptions extends AxisOptions {}
/** Mean of elements along an axis */
export interface MeanOptions extends AxisOptions {}
/** Options for max reduction */
export interface MaxOptions extends AxisOptions {}
/** Options for min reduction */
export interface MinOptions extends AxisOptions {}
/** Options for median reduction */
export interface MedianOptions extends AxisOptions {}
