// --- vectorview.ts ---
import { NDView, type FlatBuffer, type TypedArray } from './view'
import { indexToCoords, product } from './helpers'

export interface VectorViewOpts<S> {
    base: FlatBuffer<FlatBuffer<S>>
    shape: number[]
    offset: number
    strides: number[]
    dim: number
    vecLen: number
    orig: NDView<S>
}

export class VectorView<S> extends NDView<
    FlatBuffer<S>,
    FlatBuffer<S>,
    unknown[],
    ArrayConstructor
> {
    public readonly dim: number
    public readonly vecLen: number
    private readonly orig: NDView<S>

    constructor({ base, dim, offset, orig, shape, strides, vecLen }: VectorViewOpts<S>) {
        super(base, shape, offset, strides)
        this.dim = dim
        this.vecLen = vecLen
        this.orig = orig
    }

    *[Symbol.iterator](): IterableIterator<{
        coords: number[]
        value: FlatBuffer<S>
    }> {
        const total = product(this.shape)
        for (let i = 0; i < total; i++) {
            const coords = indexToCoords(i, this.shape)
            const fullCoords = coords.slice(0, this.dim).concat([0]).concat(coords.slice(this.dim))
            const baseIdx = this.orig.idx(fullCoords)
            const step = this.orig.strides[this.dim]
            let vec: FlatBuffer<S>

            if (
                !Array.isArray(this.base) &&
                step === 1 &&
                typeof (this.base as { subarray: unknown }).subarray === 'function'
            ) {
                vec = (this.base as TypedArray).subarray(
                    baseIdx,
                    baseIdx + this.vecLen,
                ) as FlatBuffer<S>
            } else if (Array.isArray(this.base) && step === 1) {
                vec = (this.base as S[]).slice(baseIdx, baseIdx + this.vecLen) as FlatBuffer<S>
            } else {
                const tmp: S[] = []
                for (let j = 0; j < this.vecLen; j++) {
                    tmp.push(this.base[baseIdx + j * step] as S)
                }
                vec = tmp as FlatBuffer<S>
            }

            yield { coords, value: vec }
        }
    }

    contiguous(): NDView<FlatBuffer<S>> {
        const newBaseData: FlatBuffer<S>[] = []
        const viewShape = this.shape

        for (const { value: vector } of this) {
            let processedVector: FlatBuffer<S>
            if (Array.isArray(vector)) {
                processedVector = [...vector]
            } else {
                processedVector = Array.from(vector as Iterable<S>)
            }
            newBaseData.push(processedVector)
        }

        return new NDView<FlatBuffer<S>>(newBaseData, viewShape)
    }
}

export function vectorize<T>(
    view: NDView<T>,
    opts: { dim: number; contiguous?: boolean } = {
        dim: view.rank - 1,
    },
): VectorView<T> {
    if (opts.dim < 0 || opts.dim >= view.rank) throw new Error('dim out of bounds')

    const vecLen = view.shape[opts.dim]
    const newShape = [...view.shape]
    newShape.splice(opts.dim, 1)
    const newStrides = [...view.strides]
    newStrides.splice(opts.dim, 1)

    let vv = new VectorView<T>({
        base: view.base as FlatBuffer<FlatBuffer<T>>,
        shape: newShape,
        offset: view.offset,
        strides: newStrides,
        dim: opts.dim,
        vecLen,
        orig: view,
    })

    if (opts.contiguous) {
        vv = vv.contiguous() as VectorView<T>
    }

    return vv
}
