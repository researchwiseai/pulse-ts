/**
 * High-level orchestrator for Pulse API processes.
 */
import type { CoreClient } from './core/clients/CoreClient'
import * as Processes from './processes'
import type { MutableTuple } from './processes/types'

/** Options for Analyzer. */
export interface AnalyzerOptions<
    ProcessCollection extends readonly Processes.Process<string, unknown>[]
> {
    /** Array of input texts. */
    dataset: string[]
    /** Processing steps to execute. */
    processes: ProcessCollection
    /** Core client to call API endpoints. */
    client: CoreClient
    /** Fast mode flag; if true, use fast synchronous endpoints where supported. */
    fast?: boolean
}

export class Analyzer<ProcessCollection extends readonly Processes.Process<string, unknown>[]> {
    dataset: string[]
    processes: ProcessCollection
    fast: boolean
    client: CoreClient
    /** In-memory results mapping process id to wrapped result. */
    results: Record<string, unknown>

    constructor(opts: AnalyzerOptions<ProcessCollection>) {
        this.dataset = opts.dataset
        this.processes = opts.processes ?? []
        this.fast = opts.fast ?? false
        this.client = opts.client
        this.results = {}
        this.resolveDependencies()
    }

    private resolveDependencies(): void {
        const existing = new Set(this.processes.map(p => p.id))

        const resolved = [] as MutableTuple<ProcessCollection>
        for (const proc of this.processes) {
            for (const dep of proc.dependsOn ?? []) {
                if (!existing.has(dep)) {
                    if (dep === Processes.ThemeGeneration.id) {
                        resolved.push(new Processes.ThemeGeneration())
                        existing.add(dep)
                    } else {
                        throw new Error(`Missing dependency process '${dep}'`)
                    }
                }
            }
            resolved.push(proc)
        }
        this.processes = resolved
    }

    /**
     * Execute the configured processes and wrap results.
     */
    async run(): Promise<AnalysisResult> {
        const output: Record<string, any> = {}
        for (const proc of this.processes) {
            const id = proc.id
            output[id] = await proc.run(this)
            // Store in results for the next process to be able to access
            this.results = output
        }
        return new AnalysisResult(output)
    }

    /** Close underlying resources (noop). */
    close(): void {
        // no resources to close in this implementation
    }
}

/**
 * Container for analysis results, exposing process outcomes as properties.
 */
export class AnalysisResult {
    constructor(results: Record<string, any>) {
        Object.assign(this, results)
    }
}
