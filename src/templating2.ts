type ProcessName = string

interface Context {}

interface SentimentResult {}

interface ThemeGenerationResult {}

class Process<Name extends ProcessName> {
    public readonly name: Name

    constructor(name: Name) {
        this.name = name
    }

    async run() {
        throw new Error('Not implemented abstract Process')
    }
}

class SentimentAnalysis<Name extends ProcessName = 'sentiment'> extends Process<Name> {
    static readonly defaultName: ProcessName = 'sentiment'

    constructor({ name }: { name?: Name } = {}) {
        super(name ?? (SentimentAnalysis.defaultName as Name))
    }

    async run(ctx: Context): Promise<SentimentResult> {}
}

class ThemeGeneration<Name extends ProcessName = 'themes'> extends Process<Name> {
    static readonly defaultName: ProcessName = 'themes'

    constructor({ name }: { name?: Name } = {}) {
        super(name ?? (ThemeGeneration.defaultName as Name))
    }

    async run(ctx: Context): Promise<ThemeGenerationResult> {}
}

type Processes =
    | [SentimentAnalysis, ThemeGeneration]
    | [ThemeGeneration, SentimentAnalysis]
    | [SentimentAnalysis]
    | [ThemeGeneration]

type Result<P, Names extends Array<ProcessName>> = P extends [SentimentAnalysis, ThemeGeneration]
    ? { sentiment: SentimentResult; themes: ThemeGenerationResult }
    : P extends [ThemeGeneration, SentimentAnalysis]
    ? { sentiment: SentimentResult; themes: ThemeGenerationResult }
    : P extends [SentimentAnalysis]
    ? { sentiment: SentimentResult }
    : { themes: ThemeGenerationResult }

class Analyzer<P extends Processes, Names extends Array<ProcessName>> {
    private readonly _processes: P
    private readonly _dataset: string[]
    private _context: Context = {}

    constructor({ processes, dataset }: { processes: P; dataset: string[] }) {
        this._processes = processes
        this._dataset = dataset
    }

    async run(): Promise<Result<P, Names>> {
        const results: Partial<Result<P, Array<'sentiment' | 'themes'>>> = {}

        for (const process of this._processes) {
            results[process.name] = await process.run(this._context)
        }

        return results as Result<P>
    }
}

const sentiment = new SentimentAnalysis({ name: 'i-will-win' })
const nameS = sentiment.name

const obj = { [sentiment.name]: sentiment }
obj['i-will-win']

const analyzer = new Analyzer({ dataset: [], processes: [new SentimentAnalysis()] })

;(async () => {
    const result = await analyzer.run()
})()
