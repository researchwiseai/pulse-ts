/**
 * generate.ts
 *
 * Implements the heavy lifting for Matrix.generate and Matrix.generateSelf,
 * extracting Cartesian-product mapping, concurrency control, timing, and
 * header construction into a dedicated module.
 */
import { unflatten } from '../../core/helpers'
import type { NDView } from '../../core/view'
import type { NestedArray } from '../../core/basic'
import type { Headers } from './headers'

/**
 * Options for generating a matrix by mapping `fn` over the Cartesian product of axis iterables.
 *
 * @template T - Element type of the resulting matrix.
 * @template S - Type of each axis coordinate (string or string[]).
 */
export interface GenerateOptions<T, S extends string | string[] = string | string[]> {
    /** Map function called for each coordinate tuple. */
    fn: (coords: S[]) => Promise<{ result: T }>
    /** List of iterables, one per axis, to form the Cartesian product. */
    iterables: S[][]
    /** Hook invoked before processing each axis (optional). */
    before?: (dim: number, iterable: S[], headers: Headers) => void
    /** Max concurrent calls to `fn` (pool size). Defaults to 10. */
    poolSize?: number
    /**
     * Optional header factory: given an axis index and its iterable,
     * returns per-element header arrays or null/undefined to control labels.
     */
    headers?: (
        dim: number,
        iterable: S[],
    ) => Promise<Headers[number] | undefined | null> | Headers[number] | undefined | null
}

/**
 * Options for generating a square matrix by self-comparing a single iterable.
 *
 * Inherits everything from GenerateOptions except `fn` and `iterables`,
 * replacing them with a single iterable and a pairwise mapping function.
 */
export type GenerateSelfOptions<T, S extends string | string[] = string | string[]> = Omit<
    GenerateOptions<T, S>,
    'iterables' | 'fn'
> & {
    iterable: S[]
    fn: (a: S, b: S) => Promise<{ result: T }>
}

/**
 * Minimal interface for the Matrix class, exposing only the static `from` factory.
 * Used to avoid circular imports at runtime.
 */
export interface MatrixConstructor {
    from<U>(data: NestedArray<U> | NDView<U>, headers?: Headers): import('.').Matrix<U>
}

/**
 * Core implementation of Matrix.generate.
 * Iterates the Cartesian product of `iterables`, throttles concurrency,
 * collects timing metadata, and constructs the final Matrix instance.
 */
export async function generateImpl<U, S extends string | string[]>(
    MatrixClass: MatrixConstructor,
    { iterables, fn, poolSize = 10, headers: headerFn }: GenerateOptions<U, S>,
): Promise<{
    matrix: import('.').Matrix<U>
    report: {
        cellsPerSecond: number
        cells: number
        timePerCell: string
        longestCellComputation: string
        preCellsDuration: string
        postCellsDuration: string
        cellReport: { start: number; end: number }[]
        totalTimeTaken: string
    }
    timeline: () => string
}> {
    if (iterables.length < 1) {
        throw new Error(
            'Matrix.generate: requires at least one axis iterable and a mapping function',
        )
    }
    const totalStart = performance.now()
    const dims = iterables.length
    const shape = iterables.map(ax => ax.length)
    // Build Cartesian product of coordinates
    const coordsList: S[][] = []
    const prefix: S[] = new Array<S>(dims)
    function buildCoords(dim: number) {
        if (dim === dims) {
            coordsList.push(prefix.slice())
            return
        }
        for (const v of iterables[dim]) {
            prefix[dim] = v
            buildCoords(dim + 1)
        }
    }
    buildCoords(0)
    const total = coordsList.length
    const results: U[] = new Array(total)
    const timeTaken: { start: number; end: number }[] = new Array(total)
    const concurrency = poolSize > 0 ? poolSize : 10
    const executing: Promise<void>[] = []
    let index = 0
    async function enqueue(): Promise<void> {
        while (index < total && executing.length < concurrency) {
            const current = index++
            const coords = coordsList[current]
            const task = (async () => {
                const start = performance.now()
                const { result } = await fn(coords)
                results[current] = result
                timeTaken[current] = { start, end: performance.now() }
            })()
            const p = task.then(() => {
                executing.splice(executing.indexOf(p), 1)
            })
            executing.push(p)
        }
        if (executing.length > 0) {
            await Promise.race(executing)
            return enqueue()
        }
    }
    await enqueue()
    await Promise.all(executing)
    // Reshape into nested arrays
    const nested = unflatten(results, shape) as NestedArray<U>
    const totalEnd = performance.now()
    const totalTimeTaken = totalEnd - totalStart
    const timePerCell = totalTimeTaken / total
    const cellsPerSecond = Math.round((total * 1000) / totalTimeTaken)
    // Placeholder timeline
    const timeline = (): string => {
        throw new Error('Not yet implemented')
    }
    // Construct headers per axis
    const headersArr = headerFn
        ? await Promise.all(
              iterables.map((iter, dim) =>
                  Promise.resolve(headerFn(dim, iter)).then(hf => {
                      if (hf === undefined) {
                          return iter.map(input => [
                              {
                                  key: 'label',
                                  type: 's' as const,
                                  value: Array.isArray(input) ? input.join(' ') : String(input),
                              },
                          ])
                      } else if (hf === null) {
                          return Array(iter.length).fill([])
                      } else {
                          return hf
                      }
                  }),
              ),
          )
        : iterables.map(iter =>
              iter.map(input => [
                  {
                      key: 'label',
                      type: 's' as const,
                      value: Array.isArray(input) ? input.join(' ') : String(input),
                  },
              ]),
          )
    return {
        matrix: MatrixClass.from<U>(nested, headersArr),
        report: {
            cellsPerSecond,
            cells: total,
            timePerCell: `${timePerCell.toFixed(2)} ms`,
            longestCellComputation: `${(
                Math.max(...timeTaken.map(t => t.end - t.start)) / 1000
            ).toFixed(2)} s`,
            preCellsDuration: `${(
                timeTaken.reduce((acc, t) => Math.min(acc, t.start), Date.now()) - totalStart
            ).toFixed(0)} ms`,
            postCellsDuration: `${(
                totalEnd - timeTaken.reduce((acc, t) => Math.max(acc, t.end), 0)
            ).toFixed(2)} ms`,
            cellReport: timeTaken,
            totalTimeTaken: Math.round(totalTimeTaken).toString() + ' ms',
        },
        timeline,
    }
}

/**
 * Core implementation of Matrix.generateSelf, wrapping generateImpl
 * with a symmetric comparison over a single iterable.
 */
export async function generateSelfImpl<U, S extends string | string[]>(
    MatrixClass: MatrixConstructor,
    { iterable, fn: pairFn, poolSize, headers: headerFn, before }: GenerateSelfOptions<U, S>,
) {
    return generateImpl<U, S>(MatrixClass, {
        iterables: [iterable, iterable],
        fn: async coords => {
            if (coords[0] <= coords[1]) {
                // preserve triangle (no-op)
                return { result: undefined as unknown as U }
            }
            return pairFn(coords[0], coords[1])
        },
        poolSize,
        headers: headerFn,
        before,
    })
}
