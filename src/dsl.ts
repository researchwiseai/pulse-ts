/**
 * DSL builder for composing sequences of Processes.
 */
import fs from 'fs'
import path from 'path'
import { CoreClient } from './core/clients/CoreClient'
import { Cluster } from './processes/Cluster'
import { ThemeExtraction } from './processes/ThemeExtraction'
import { ThemeAllocation } from './processes/ThemeAllocation'
import { Sentiment } from './processes/Sentiment'
import { ThemeGeneration } from './processes/ThemeGeneration'
import { ClusterResult, ThemeExtractionResult } from './results'
import { ThemeAllocationResult } from './results/ThemeAllocationResult'
import { SentimentResult } from './results/SentimentResult'
import { ThemeGenerationResult } from './results/ThemeGenerationResult'
import { Analyzer } from './analyzer'
import type { Processes } from '.'
import type { ContextBase } from './processes'

type MonitorCallbacks = {
    onRunStart?: () => void
    onProcessStart?: (id: string) => void
    onProcessEnd?: (id: string, res: any) => void
    onRunEnd?: () => void
}

/** Flatten nested arrays and record original shape. */
function flattenAndShape(x: any): [number[], any[]] {
    const shape: number[] = []
    function getShape(a: any, lvl = 0): void {
        if (Array.isArray(a)) {
            shape[lvl] = Math.max(shape[lvl] || 0, a.length)
            if (a.length) getShape(a[0], lvl + 1)
        }
    }
    function flatten(a: any): any[] {
        if (Array.isArray(a)) {
            return a.reduce((acc, v) => acc.concat(flatten(v)), [] as any[])
        }
        return [a]
    }
    getShape(x)
    const flat = flatten(x)
    return [shape, flat]
}

/** Reconstruct nested arrays from flat list using provided shape. */
function reconstruct(flat: any[], shape: number[]): any {
    const it = flat[Symbol.iterator]()
    function build(level: number): any {
        if (level >= shape.length) {
            const { value } = it.next()
            return value
        }
        const len = shape[level] as number
        const res: any[] = []
        for (let i = 0; i < len; i++) {
            res.push(build(level + 1))
        }
        return res
    }
    return build(0)
}

/**
 * Workflow builder for custom pipelines.
 */
export class Workflow {
    private sources: Record<string, any> = {}
    private processes: Processes.Process<string>[] = []
    private idCounts: Record<string, number> = {}
    private monitors: MonitorCallbacks = {}

    /**
     * Register named data source for DSL steps.
     */
    source(name: string, data: any): this {
        if (this.sources[name]) {
            throw new Error(`Source '${name}' already registered`)
        }
        this.sources[name] = data
        return this
    }

    private addProcess(proc: Processes.Process<string>, name?: string): void {
        const orig = (proc as any).id
        const count = (this.idCounts[orig] || 0) + 1
        this.idCounts[orig] = count
        ;(proc as any)._origId = orig
        if (name) {
            if (this.sources[name] || this.processes.some(p => p.id === name)) {
                throw new Error(`Process name '${name}' already registered`)
            }
            ;(proc as any).id = name
        } else if (count > 1) {
            ;(proc as any).id = `${orig}_${count}`
        }
        this.processes.push(proc)
    }

    theme_generation(
        options: {
            minThemes?: number
            maxThemes?: number
            context?: any
            fast?: boolean
            source?: string
            name?: string
        } = {}
    ): this {
        const { minThemes, maxThemes, context, fast, source, name } = options
        const proc = new ThemeGeneration({ minThemes, maxThemes, context, fast })
        this.addProcess(proc, name)
        const alias = source || 'dataset'
        if (
            alias !== 'dataset' &&
            !this.sources[alias] &&
            !this.processes.some(p => p.id === alias)
        ) {
            throw new Error(`Unknown source for theme_generation: '${alias}'`)
        }
        ;(proc as any)._inputs = [alias]
        return this
    }

    theme_allocation(
        options: {
            themes?: string[]
            fast?: boolean
            singleLabel?: boolean
            threshold?: number
            inputs?: string
            themesFrom?: string
            name?: string
        } = {}
    ): this {
        const { themes, fast, singleLabel, threshold, inputs, themesFrom, name } = options
        const textAlias = inputs || 'dataset'
        if (themes == null && themesFrom == null) {
            if (
                textAlias !== 'dataset' &&
                !this.sources[textAlias] &&
                !this.processes.some(p => p.id === textAlias)
            ) {
                throw new Error(`Unknown inputs source for theme_allocation: '${textAlias}'`)
            }
            if (!this.processes.some(p => (p as any)._origId === ThemeGeneration.id)) {
                this.theme_generation({ source: textAlias })
            }
        }
        const proc = new ThemeAllocation({ themes, singleLabel, fast, threshold })
        this.addProcess(proc, name)
        const inp = inputs || 'dataset'
        if (inp !== 'dataset' && !this.sources[inp] && !this.processes.some(p => p.id === inp)) {
            throw new Error(`Unknown inputs source for theme_allocation: '${inp}'`)
        }
        ;(proc as any)._inputs = [inp]
        if (themes == null) {
            let alias = themesFrom
            if (!alias) {
                alias = Array.from(this.processes)
                    .filter(p => (p as any)._origId === ThemeGeneration.id)
                    .pop()?.id
            }
            if (!alias) {
                throw new Error('No theme_generation found for theme_allocation')
            }
            ;(proc as any)._themesFromAlias = alias
        }
        return this
    }

    theme_extraction(
        options: {
            themes?: string[]
            version?: string
            fast?: boolean
            inputs?: string
            themesFrom?: string
            name?: string
        } = {}
    ): this {
        const { themes, version, fast, inputs, themesFrom, name } = options
        const proc = new ThemeExtraction({ themes, version, fast })
        this.addProcess(proc, name)
        const inp = inputs || 'dataset'
        if (inp !== 'dataset' && !this.sources[inp] && !this.processes.some(p => p.id === inp)) {
            throw new Error(`Unknown inputs source for theme_extraction: '${inp}'`)
        }
        ;(proc as any)._inputs = [inp]
        if (themes == null) {
            let alias = themesFrom
            if (!alias) {
                alias = Array.from(this.processes)
                    .filter(p => (p as any)._origId === ThemeGeneration.id)
                    .pop()?.id
            }
            if (!alias) {
                throw new Error('No theme_generation found for theme_extraction')
            }
            ;(proc as any)._themesFromAlias = alias
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
            !this.sources[alias] &&
            !this.processes.some(p => p.id === alias)
        ) {
            throw new Error(`Unknown source for sentiment: '${alias}'`)
        }
        ;(proc as any)._inputs = [alias]
        return this
    }

    cluster(options: { fast?: boolean; source?: string; name?: string } = {}): this {
        const { fast, source, name } = options
        const proc = new Cluster({ fast })
        this.addProcess(proc, name)
        const alias = source || 'dataset'
        if (
            alias !== 'dataset' &&
            !this.sources[alias] &&
            !this.processes.some(p => p.id === alias)
        ) {
            throw new Error(`Unknown source for cluster: '${alias}'`)
        }
        ;(proc as any)._inputs = [alias]
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
        const ext = path.extname(filePath).toLowerCase()
        const raw = fs.readFileSync(filePath, 'utf-8')
        let config: any
        if (ext === '.json') {
            config = JSON.parse(raw)
        } else {
            throw new Error(`Unsupported config type: ${filePath}`)
        }
        const pipeline = config.pipeline || []
        for (const step of pipeline) {
            if (
                !step ||
                typeof step !== 'object' ||
                Array.isArray(step) ||
                Object.keys(step).length !== 1
            ) {
                throw new Error(`Invalid pipeline step: ${JSON.stringify(step)}`)
            }
            const [name, params] = Object.entries(step)[0]
            if (typeof (wf as any)[name] !== 'function') {
                throw new Error(`Unknown pipeline step: ${name}`)
            }
            ;(wf as any)[name](params || {})
        }
        return wf
    }

    /**
     * Execute workflow: DSL mode if sources registered, else Analyzer mode.
     */
    async run(dataset?: any, options: { client?: CoreClient; fast?: boolean } = {}): Promise<any> {
        const client = options.client
        const fast = options.fast
        if (Object.keys(this.sources).length > 0) {
            if (dataset != null && !this.sources.dataset) {
                this.sources.dataset = dataset
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

    private async runDsl(client?: CoreClient, fast?: boolean): Promise<any> {
        const c = client ?? new CoreClient({ baseUrl: '', auth: null as any })
        const ctxSources = { ...this.sources }
        const results: Record<string, any> = {}
        this.monitors.onRunStart?.()
        for (const proc of this.processes) {
            this.monitors.onProcessStart?.(proc.id)
            const inputs: string[] = (proc as any)._inputs || ['dataset']
            if (!inputs.length) {
                throw new Error(`No input source for process '${proc.id}'`)
            }
            const alias = inputs[0]
            if (!(alias in ctxSources)) {
                throw new Error(`Source '${alias}' not found for process '${proc.id}'`)
            }
            const data = ctxSources[alias]
            const ctx: ContextBase & {
                sources: Record<string, unknown>
            } = {
                client: c,
                fast: fast ?? false,
                sources: ctxSources,
                results,
            }
            ctx.dataset = Array.isArray(data) ? data : [].concat(data)
            const raw = await proc.run(ctx)
            let wrapped: any
            const orig = (proc as any)._origId
            switch (orig) {
                case ThemeGeneration.id:
                    wrapped = new ThemeGenerationResult(raw, ctx.dataset)
                    ctxSources[proc.id] = wrapped.themes
                    break
                case Sentiment.id:
                    const [shape, flatTexts] = flattenAndShape(ctxSources[alias])
                    ctx.dataset = flatTexts
                    const flatRaw = await proc.run(ctx)
                    const nested = reconstruct(flatRaw.sentiments, shape)
                    wrapped = new SentimentResult(
                        { results: nested, requestId: flatRaw.requestId },
                        flatTexts
                    )
                    ctxSources[proc.id] = nested
                    break
                case ThemeAllocation.id:
                    wrapped = new ThemeAllocationResult(
                        ctx.dataset,
                        raw.themes,
                        raw.assignments,
                        (proc as ThemeAllocation).singleLabel,
                        (proc as ThemeAllocation).threshold,
                        raw.similarity
                    )
                    break
                case Cluster.id:
                    wrapped = new ClusterResult(raw as number[][], ctx.dataset)
                    break
                case ThemeExtraction.id:
                    wrapped = new ThemeExtractionResult(
                        raw,
                        ctx.dataset,
                        (proc as ThemeExtraction).themes ?? []
                    )
                    ctxSources[proc.id] = wrapped.extractions
                    break
                default:
                    wrapped = raw
            }
            results[proc.id] = wrapped
            this.monitors.onProcessEnd?.(proc.id, wrapped)
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
            const orig = (p as any)._origId
            origMap[orig] = origMap[orig] || []
            origMap[orig].push(p.id)
        }
        const ids = this.processes.map(p => p.id)
        for (const p of this.processes) {
            const alias = p.id
            let deps: string[] = []
            for (const dep of (p as any).dependsOn || []) {
                deps = deps.concat(origMap[dep] || [])
            }
            for (const inp of (p as any)._inputs || []) {
                if (inp !== 'dataset' && ids.includes(inp)) deps.push(inp)
            }
            const themeSrc = (p as any)._themesFromAlias
            if (themeSrc && ids.includes(themeSrc)) deps.push(themeSrc)
            // unique
            edges[alias] = Array.from(new Set(deps))
        }
        return edges
    }
}
