// Define base class for analysis processes
class AnalysisProcess {
    name: string // Default name - will be overridden.

    constructor(name: string) {
        this.name = name
    }

    async run(): Promise<any> {
        // Abstract method, must be implemented by subclasses
        throw new Error("Method 'run()' must be implemented.")
    }
}

// Example Analysis Processes (implementing the base class)
class SentimentAnalysis extends AnalysisProcess {
    constructor(public options: any) {
        super('sentiment')
    }

    async run(): Promise<{ score: number }> {
        console.log('Running sentiment analysis...')
        return { score: 0.8 } // Placeholder result
    }
}

class ThemeGeneration extends AnalysisProcess {
    constructor(public options: { name: string }) {
        super('theme')
    }

    async run(): Promise<{ themes: string[] }> {
        console.log('Running theme generation...')
        return { themes: ['special1', 'special2'] } // Placeholder result
    }
}

class AnomalyDetection extends AnalysisProcess {
    constructor(public options: any) {
        super('anomaly')
    }

    async run(): Promise<{ anomalies: string[] }> {
        console.log('Running anomaly detection...')
        return { anomalies: ['anomaly1', 'anomaly2'] } // Placeholder result
    }
}

// The Analyzer Class (with Generics)
class Analyzer<T extends AnalysisProcess> {
    dataset: any[]
    processes: T[]

    constructor(dataset: any[], options: { processes: T[] }) {
        this.dataset = dataset
        this.processes = options.processes
    }

    async run(): Promise<{
        [key in T[0]['name'] extends string ? key : never]: ReturnType<T[0]['run']>
    }> {
        const results: any = {}

        for (const process of this.processes) {
            results[process.name] = await process.run()
        }

        return results
    }
}

// Usage Example
async function main() {
    const sentiment = new SentimentAnalysis({
        /* options */
    })
    const themes = new ThemeGeneration({ name: 'specials' })
    const dataset = [
        /* data */
    ]

    const analyzer = new Analyzer(dataset, { processes: [sentiment, themes] })

    const result = await analyzer.run()

    console.log(result.sentiment) // Good - Intellisense knows about sentiment
    console.log(result.specials) // Good - Intellisense knows about specials
    // console.log(result.anomalies);  // Error: Property 'anomalies' does not exist on type '{ sentiment: { score: number }; specials: { themes: string[] } }'
}

main()
