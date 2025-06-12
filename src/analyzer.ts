/**
 * High-level orchestrator for Pulse API processes.
 */
import type { CoreClient } from './core/clients/CoreClient'
import * as Processes from './processes'
import type { MutableTuple, TupleToResult, ContextBase } from './processes/types'

/** Options for Analyzer. */
export interface AnalyzerOptions<
    ProcessCollection extends readonly Processes.Process<string, unknown>[],
> {
    /** Initial datasets mapping alias to array of texts. */
    dataset: string[]
    /** Processing steps to execute. */
    processes: ProcessCollection
    /** Core client to call API endpoints. */
    client: CoreClient
    /** Fast mode flag; if true, use fast synchronous endpoints where supported. */
    fast?: boolean
}

export class Analyzer<ProcessCollection extends readonly Processes.Process<string, unknown>[]> {
    private datasets: Record<string, unknown>
    processes: ProcessCollection
    fast: boolean
    client: CoreClient

    constructor(opts: AnalyzerOptions<ProcessCollection>) {
        this.datasets = { dataset: opts.dataset }
        this.processes = opts.processes ?? []
        this.fast = opts.fast ?? false
        this.client = opts.client
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
    async run(): Promise<TupleToResult<ProcessCollection>> {
        const output: [string, unknown][] = []
        for (const proc of this.processes) {
            const id = proc.id
            const inputs: string[] = (proc as any)._inputs ?? ['dataset']
            const alias = inputs[0]
            if (!(alias in this.datasets)) {
                throw new Error(`Dataset '${alias}' not found for process '${id}'`)
            }
            const data = this.datasets[alias]
            const ctx: ContextBase = {
                client: this.client,
                fast: this.fast,
                datasets: this.datasets,
                processes: this.processes,
            }
            ctx.datasets[alias] = Array.isArray(data) ? data : [data]
            const result = await proc.run(ctx)

            this.datasets[id] = result
            output.push([id, result])
        }
        return Object.fromEntries(output) as TupleToResult<ProcessCollection>
    }

    /** Close underlying resources (noop) . */
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
