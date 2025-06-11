import type { Theme as ThemeModel } from '../models'
import { ThemeAllocationResult } from '../results/ThemeAllocationResult'
import type { ThemeGenerationResult } from '../results/ThemeGenerationResult'
import { ThemeGeneration, ThemeGenerationDependent } from './ThemeGeneration'
import { staticImplements, type ContextBase, type Process, type ProcessStatic } from './types'

/**
 * Process: allocate themes to texts based on generation results.
 */

@staticImplements<ProcessStatic<'themeAllocation', ThemeAllocationResult>>()
/**
 * Represents a process for allocating themes to items in a dataset based on similarity.
 *
 * The `ThemeAllocation` class implements the `Process` interface and is responsible for assigning
 * one or more themes to each item in a dataset by comparing the items to theme representatives.
 * It supports both single-label and multi-label allocation modes, configurable thresholds, and
 * an optional fast processing mode.
 *
 * @template Name - The type of the process name, defaults to `'theme_allocation'`.
 *
 * @remarks
 * - If `themes` are not provided, the process depends on the output of a `ThemeGeneration` process.
 * - The allocation is performed by computing a similarity matrix between the dataset and theme representatives,
 *   then assigning themes based on the highest similarity scores.
 * - The process can be customized via the constructor options for label mode, threshold, and speed.
 *
 * @example
 * ```typescript
 * const allocation = new ThemeAllocation({
 *   themes: ['Theme A', 'Theme B'],
 *   singleLabel: true,
 *   threshold: 0.6
 * });
 * const result = await allocation.run(context);
 * ```
 *
 * @see ThemeGeneration
 * @see ThemeAllocationResult
 */
export class ThemeAllocation<Name extends string = 'themeAllocation'>
    extends ThemeGenerationDependent
    implements Process<Name, ThemeAllocationResult>
{
    static readonly id = 'themeAllocation'
    /**
     * The name associated with the theme allocation.
     */
    name: Name
    /**
     * Indicates whether only a single label should be used.
     * When set to `true`, the process will operate in single-label mode.
     */
    singleLabel: boolean
    /**
     * If set to `true`, enables a faster, potentially less thorough processing mode.
     * This may be used to speed up operations where full accuracy is not required.
     */
    fast?: boolean
    /**
     * The minimum value at which a certain condition or action is triggered.
     * Used to determine if a specific threshold has been met or exceeded.
     */
    threshold: number

    /**
     * Constructs a new instance of the ThemeAllocation class.
     *
     * @param options - Configuration options for theme allocation.
     * @param options.themes - An optional array of theme names (as strings) or ThemeModel objects to be used for allocation.
     * @param options.singleLabel - If true, only a single theme label will be assigned. Defaults to true.
     * @param options.fast - If true, enables a faster allocation mode (implementation-dependent).
     * @param options.threshold - The minimum threshold (between 0 and 1) for theme allocation. Defaults to 0.5.
     * @param options.name - An optional name for this allocation instance. Defaults to ThemeAllocation.id.
     */
    constructor(
        options: {
            themes?: string[] | ThemeModel[]
            singleLabel?: boolean
            fast?: boolean
            threshold?: number
            name?: Name
        } = {}
    ) {
        super(options)
        this.singleLabel = options.singleLabel ?? true
        this.fast = options.fast
        this.threshold = options.threshold ?? 0.5
        this.name = options.name ?? (ThemeAllocation.id as Name)
    }

    /**
     * Gets the static `id` property of the `ThemeAllocation` class.
     * @returns The unique identifier for the `ThemeAllocation` class.
     */
    get id() {
        return ThemeAllocation.id
    }

    /**
     * Executes the theme allocation process by comparing the similarity between the dataset and theme representatives.
     *
     * - Determines the set of themes to use, either from the instance or from the results of a previous ThemeGeneration process.
     * - Extracts labels and representative texts from the themes.
     * - Calls the similarity comparison client to generate a similarity matrix between the dataset and theme representatives.
     * - Computes assignments by selecting the most similar theme for each item in the dataset.
     * - Returns a `ThemeAllocationResult` containing the dataset, labels, assignments, and similarity matrix.
     *
     * @param ctx - The context object containing the dataset, process results, and client for similarity comparison.
     * @returns A promise that resolves to a `ThemeAllocationResult` with the allocation details.
     */
    async run(ctx: ContextBase) {
        const labels = this.themeLabels(ctx)
        const simTexts = this.themeRepresentatives(ctx)
        const fastFlag = this.fast ?? ctx.fast
        const resp = await ctx.client.compareSimilarity(
            { setA: ctx.dataset, setB: simTexts },
            { fast: fastFlag }
        )
        // similarity matrix or nested arrays
        const simMatrix: number[][] = resp.matrix
        // compute assignments
        const assignments = simMatrix.map(row =>
            row.reduce(
                (bestIdx, _, i) => ((row[i] as number) > (row[bestIdx] as number) ? i : bestIdx),
                0
            )
        )

        return new ThemeAllocationResult(
            ctx.dataset,
            labels,
            assignments,
            this.singleLabel,
            this.threshold,
            simMatrix
        )
    }
}
