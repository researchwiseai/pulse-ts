/**
 * Built-in Process primitives for Analyzer.
 */
import type { CoreClient } from './core/client'
import type { Theme as ThemeModel } from './models'

/**
 * Protocol for a processing step in Analyzer or DSL.
 */
export interface Process {
    id: string
    dependsOn: string[]
    run(ctx: any): Promise<any> | any
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

/**
 * Process: cluster texts into latent themes.
 */
export class ThemeGeneration implements Process {
    static readonly id = 'theme_generation'
    id = ThemeGeneration.id
    dependsOn: string[] = []

    minThemes: number
    maxThemes: number
    context: any
    fast?: boolean

    constructor(
        options: {
            minThemes?: number
            maxThemes?: number
            context?: any
            fast?: boolean
        } = {},
    ) {
        this.minThemes = options.minThemes ?? 2
        this.maxThemes = options.maxThemes ?? 50
        this.context = options.context
        this.fast = options.fast
    }

    async run(ctx: any) {
        let texts: string[] = Array.isArray(ctx.dataset) ? ctx.dataset : []
        const fastFlag = this.fast ?? ctx.fast
        const sampleSize = fastFlag ? 200 : 1000
        if (texts.length > sampleSize) {
            texts = shuffle(texts).slice(0, sampleSize)
        }
        return ctx.client.generate_themes(texts, this.minThemes, this.maxThemes, fastFlag)
    }
}

/**
 * Process: classify sentiment for texts.
 */
export class SentimentProcess implements Process {
    static readonly id = 'sentiment'
    id = SentimentProcess.id
    dependsOn: string[] = []

    fast?: boolean

    constructor(options: { fast?: boolean } = {}) {
        this.fast = options.fast
    }

    run(ctx: any) {
        const texts: string[] = Array.isArray(ctx.dataset) ? ctx.dataset : []
        const fastFlag = this.fast ?? ctx.fast
        return ctx.client.analyze_sentiment(texts, fastFlag)
    }
}

/**
 * Process: allocate themes to texts based on generation results.
 */
export class ThemeAllocation implements Process {
    static readonly id = 'theme_allocation'
    id = ThemeAllocation.id
    dependsOn: string[] = [ThemeGeneration.id]

    themes?: string[] | ThemeModel[]
    singleLabel: boolean
    fast?: boolean
    threshold: number

    constructor(
        options: {
            themes?: string[] | ThemeModel[]
            singleLabel?: boolean
            fast?: boolean
            threshold?: number
        } = {},
    ) {
        this.themes = options.themes
        this.singleLabel = options.singleLabel ?? true
        this.fast = options.fast
        this.threshold = options.threshold ?? 0.5
    }

    async run(ctx: any) {
        const texts: string[] = Array.isArray(ctx.dataset) ? ctx.dataset : []
        let rawThemes: any[]
        if (this.themes != null) {
            rawThemes = [...this.themes]
        } else {
            const alias = (this as any)._themesFromAlias || ThemeGeneration.id
            const prev = ctx.results[alias]
            if (prev != null && Array.isArray(prev.themes)) {
                rawThemes = prev.themes
            } else if (ctx.sources?.[alias]) {
                rawThemes = [...ctx.sources[alias]]
            } else {
                throw new Error(`${alias} result not available for allocation`)
            }
        }
        // Prepare labels and representative texts
        let labels: string[]
        let simTexts: string[]
        if (rawThemes.length > 0 && typeof (rawThemes[0] as any).shortLabel === 'string') {
            labels = (rawThemes as ThemeModel[]).map(t => t.shortLabel)
            simTexts = (rawThemes as ThemeModel[]).map(t => t.representatives.join(' '))
        } else {
            labels = rawThemes as string[]
            simTexts = rawThemes as string[]
        }
        const fastFlag = this.fast ?? ctx.fast
        const resp = await ctx.client.compare_similarity(texts, fastFlag, false)
        // similarity matrix or nested arrays
        const simMatrix: number[][] = (resp as any).similarity ?? (resp as number[][])
        // compute assignments
        const assignments = simMatrix.map(row =>
            row.reduce((bestIdx, _, i) => (row[i] > row[bestIdx] ? i : bestIdx), 0),
        )
        return { themes: labels, assignments, similarity: simMatrix }
    }
}

/**
 * Process: extract elements matching themes from input strings.
 */
export class ThemeExtraction implements Process {
    static readonly id = 'theme_extraction'
    id = ThemeExtraction.id
    dependsOn: string[] = [ThemeGeneration.id]

    themes?: string[]
    version?: string
    fast?: boolean

    constructor(options: { themes?: string[]; version?: string; fast?: boolean } = {}) {
        this.themes = options.themes
        this.version = options.version
        this.fast = options.fast
    }

    run(ctx: any) {
        const texts: string[] = Array.isArray(ctx.dataset) ? ctx.dataset : []
        let usedThemes: string[]
        if (this.themes != null) {
            usedThemes = [...this.themes]
        } else {
            const alias = (this as any)._themesFromAlias || ThemeGeneration.id
            const prev = ctx.results[alias]
            if (prev != null && Array.isArray(prev.themes)) {
                usedThemes = prev.themes
            } else if (ctx.sources?.[alias]) {
                usedThemes = [...ctx.sources[alias]]
            } else {
                throw new Error(`${alias} result not available for extraction`)
            }
            this.themes = usedThemes
        }
        const fastFlag = this.fast ?? ctx.fast
        return ctx.client.extract_elements(texts, usedThemes, fastFlag)
    }
}

/**
 * Process: compute similarity matrix for clustering.
 */
export class Cluster implements Process {
    static readonly id = 'cluster'
    id = Cluster.id
    dependsOn: string[] = []

    fast?: boolean

    constructor(options: { fast?: boolean } = {}) {
        this.fast = options.fast
    }

    run(ctx: any) {
        const texts: string[] = Array.isArray(ctx.dataset) ? ctx.dataset : []
        const fastFlag = this.fast ?? ctx.fast
        return ctx.client.compare_similarity(texts, fastFlag, false)
    }
}
