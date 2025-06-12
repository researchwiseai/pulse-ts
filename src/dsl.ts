/**
 * DSL builder for composing sequences of Processes.
 */
import fs from 'fs'
import { z } from 'zod'
import { CoreClient } from './core/clients/CoreClient'
import { Cluster } from './processes/Cluster'
import { ThemeExtraction } from './processes/ThemeExtraction'
import { ThemeAllocation } from './processes/ThemeAllocation'
import { Sentiment } from './processes/Sentiment'
import { ThemeGeneration } from './processes/ThemeGeneration'
import { Analyzer } from './analyzer'
import type { Processes } from '.'
import type { ContextBase } from './processes'

type MonitorCallbacks = {
    onRunStart?: () => void
    onProcessStart?: (id: string) => void
    onProcessEnd?: (id: string, res: unknown) => void
    onRunEnd?: () => void
}

/**
 * Workflow builder for custom pipelines.
 */
/**
 * Internal process type with DSL metadata.
 */
type DSLProcess = Processes.Process<string> & { _origId?: string; _inputs?: string[] }

export class Workflow {
    private datasets: Record<string, unknown> = {}
    private processes: DSLProcess[] = []
    private idCounts: Record<string, number> = {}
    private monitors: MonitorCallbacks = {}

    /**
     * Register named dataset for DSL steps.
     */
    source(name: string, data: unknown): this {
        if (this.datasets[name]) {
            throw new Error(`Source '${name}' already registered`)
        }
        this.datasets[name] = data
        return this
    }

    private addProcess(proc: DSLProcess, name?: string): void {
        const orig = proc.id
        const count = (this.idCounts[orig] || 0) + 1
        this.idCounts[orig] = count
        proc._origId = orig
        if (name) {
            if (this.datasets[name] || this.processes.some(p => p.id === name)) {
                throw new Error(`Process name '${name}' already registered`)
            }
            Object.defineProperty(proc, 'id', { value: name, writable: false, configurable: true })
        } else if (count > 1) {
            Object.defineProperty(proc, 'id', {
                value: `${orig}_${count}`,
                writable: false,
                configurable: true,
            })
        }
        this.processes.push(proc)
    }

    themeGeneration(
        options: {
            minThemes?: number
            maxThemes?: number
            context?: unknown
            fast?: boolean
            source?: string
            name?: string
        } = {},
    ): this {
        const { minThemes, maxThemes, context, fast, source, name } = options
        const proc = new ThemeGeneration({ minThemes, maxThemes, context, fast })
        this.addProcess(proc, name)
        const alias = source || 'dataset'
        if (
            alias !== 'dataset' &&
            !this.datasets[alias] &&
            !this.processes.some(p => p.id === alias)
        ) {
            throw new Error(`Unknown source for themeGeneration: '${alias}'`)
        }
        proc._inputs = [alias]
        return this
    }

    themeAllocation(
        options: {
            themes?: string[]
            fast?: boolean
            singleLabel?: boolean
            threshold?: number
            inputs?: string
            themesFrom?: string
            name?: string
        } = {},
    ): this {
        const { themes, fast, singleLabel, threshold, inputs, themesFrom, name } = options
        const textAlias = inputs || 'dataset'
        if (themes == null && themesFrom == null) {
            if (
                textAlias !== 'dataset' &&
                !this.datasets[textAlias] &&
                !this.processes.some(p => p.id === textAlias)
            ) {
                throw new Error(`Unknown inputs source for themeAllocation: '${textAlias}'`)
            }
            if (!this.processes.some(p => p._origId === ThemeGeneration.id)) {
                this.themeGeneration({ source: textAlias })
            }
        }
        const proc = new ThemeAllocation({ themes, singleLabel, fast, threshold })
        this.addProcess(proc, name)
        const inp = inputs || 'dataset'
        if (inp !== 'dataset' && !this.datasets[inp] && !this.processes.some(p => p.id === inp)) {
            throw new Error(`Unknown inputs source for themeAllocation: '${inp}'`)
        }
        proc._inputs = [inp]
        if (themes == null) {
            let alias = themesFrom
            if (!alias) {
                alias = Array.from(this.processes)
                    .filter(p => p._origId === ThemeGeneration.id)
                    .pop()?.id
            }
            if (!alias) {
                throw new Error('No themeGeneration found for themeAllocation')
            }
            proc._themesFromAlias = alias
        }
        return this
    }

    themeExtraction(
        options: {
            themes?: string[]
            version?: string
            fast?: boolean
            inputs?: string
            themesFrom?: string
            name?: string
        } = {},
    ): this {
        const { themes, version, fast, inputs, themesFrom, name } = options
        const proc = new ThemeExtraction({ themes, version, fast })
        this.addProcess(proc, name)
        const inp = inputs || 'dataset'
        if (inp !== 'dataset' && !this.datasets[inp] && !this.processes.some(p => p.id === inp)) {
            throw new Error(`Unknown inputs source for themeExtraction: '${inp}'`)
        }
        proc._inputs = [inp]
        if (themes == null) {
            let alias = themesFrom
            if (!alias) {
                alias = this.processes.filter(p => p._origId === ThemeGeneration.id).pop()?.id
            }
            if (!alias) {
                throw new Error('No themeGeneration found for themeExtraction')
            }
            proc._themesFromAlias = alias
        }
        return this
    }

    sentiment(options: { fast?: boolean; source?: string; name?: string } = {}): this {
        const { fast, source, name } = options
        const proc = new Sentiment({ fast })
        this.addProcess(proc, name)
        const alias = source || 'dataset'
        if (
            alias !== 'dataset' &&
            !this.datasets[alias] &&
            !this.processes.some(p => p.id === alias)
        ) {
            throw new Error(`Unknown source for sentiment: '${alias}'`)
        }
        proc._inputs = [alias]
        return this
    }

    cluster(options: { fast?: boolean; source?: string; name?: string } = {}): this {
        const { fast, source, name } = options
        const proc = new Cluster({ fast })
        this.addProcess(proc, name)
        const alias = source || 'dataset'
        if (
            alias !== 'dataset' &&
            !this.datasets[alias] &&
            !this.processes.some(p => p.id === alias)
        ) {
            throw new Error(`Unknown source for cluster: '${alias}'`)
        }
        proc._inputs = [alias]
        return this
    }

    /**
     * Register lifecycle callbacks.
     */
    monitor(monitors: MonitorCallbacks): this {
        this.monitors = monitors
        return this
    }

    /**
     * Load workflow from JSON or YAML file.
     */
    static fromFile(filePath: string): Workflow {
        const wf = new Workflow()
        const raw = fs.readFileSync(filePath, 'utf-8')
        const schema = z.object({ pipeline: z.array(z.record(z.unknown())).optional() })
        const { pipeline } = schema.parse(JSON.parse(raw))
        for (const step of pipeline ?? []) {
            if (
                !step ||
                typeof step !== 'object' ||
                Array.isArray(step) ||
                Object.keys(step).length !== 1
            ) {
                throw new Error(`Invalid pipeline step: ${JSON.stringify(step)}`)
            }
            const [name, params] = Object.entries(step)[0]
            const fn = (wf as unknown as Record<string, (...args: unknown[]) => unknown>)[name]
            if (typeof fn !== 'function') {
                throw new Error(`Unknown pipeline step: ${name}`)
            }
            fn(params || {})
        }
        return wf
    }

    /**
     * Execute workflow: DSL mode if datasets registered, else Analyzer mode.
     */
    async run(
        dataset: string[],
        options: { client: CoreClient; fast?: boolean },
    ): Promise<Record<string, unknown>> {
        const client = options.client
        const fast = options.fast
        if (Object.keys(this.datasets).length > 0) {
            if (dataset != null && !this.datasets.dataset) {
                this.datasets.dataset = dataset
            }
            return this.runDsl(client, fast)
        }
        // simple linear mode
        const analyzer = new Analyzer({
            dataset,
            processes: this.processes,
            client: client as CoreClient,
            fast,
        })
        return analyzer.run()
    }

    private async runDsl(client: CoreClient, fast?: boolean): Promise<Record<string, unknown>> {
        const ctxDatasets = { ...this.datasets }
        const results: Record<string, unknown> = {}
        this.monitors.onRunStart?.()
        for (const proc of this.processes) {
            this.monitors.onProcessStart?.(proc.id)
            const inputs: string[] = proc._inputs ?? ['dataset']
            if (!inputs.length) {
                throw new Error(`No input source for process '${proc.id}'`)
            }
            const alias = inputs[0]
            if (!(alias in ctxDatasets)) {
                throw new Error(`Source '${alias}' not found for process '${proc.id}'`)
            }
            const data = ctxDatasets[alias]
            const ctx: ContextBase = {
                client,
                fast: fast ?? false,
                results,
                dataset: Array.isArray(data) ? data : [].concat(data),
                processes: this.processes,
            }
            const result = await proc.run(ctx)

            results[proc.id] = result
            ctxDatasets[proc.id] = result
            this.monitors.onProcessEnd?.(proc.id, result)
        }
        this.monitors.onRunEnd?.()
        return results
    }

    /**
     * Return adjacency list of workflow DAG.
     */
    graph(): Record<string, string[]> {
        const edges: Record<string, string[]> = {}
        const origMap: Record<string, string[]> = {}
        for (const p of this.processes) {
            const orig = p._origId
            if (orig) {
                origMap[orig] = origMap[orig] || []
                origMap[orig].push(p.id)
            }
        }
        const ids = this.processes.map(p => p.id)
        for (const p of this.processes) {
            const alias = p.id
            let deps: string[] = []
            for (const dep of p.dependsOn || []) {
                deps = deps.concat(origMap[dep] || [])
            }
            for (const inp of p._inputs ?? []) {
                if (inp !== 'dataset' && ids.includes(inp)) deps.push(inp)
            }
            const themeSrc = p._themesFromAlias
            if (themeSrc && ids.includes(themeSrc)) deps.push(themeSrc)
            // unique
            edges[alias] = Array.from(new Set(deps))
        }
        return edges
    }
}
