/**
 * Quick starter helpers for common use cases.
 */
import fs from 'fs'
import path from 'path'
import { CoreClient } from './core/clients/CoreClient'
import { Analyzer } from './analyzer'
import { Cluster } from './processes/Cluster'
import { ThemeAllocation } from './processes/ThemeAllocation'
import { Sentiment } from './processes/Sentiment'
import { ClusterResult } from './results'
import { ThemeAllocationResult } from './results/ThemeAllocationResult'
import { SentimentResult } from './results/SentimentResult'
import { processes } from './processes/types'

/**
 * Load input strings from an array or a file path (.txt, .csv, .tsv).
 */
export function getStrings(source: string[] | string): string[] {
    if (Array.isArray(source)) {
        return source
    }
    if (typeof source === 'string' && fs.existsSync(source)) {
        const ext = path.extname(source).toLowerCase()
        const raw = fs.readFileSync(source, 'utf-8')
        if (ext === '.txt') {
            return raw
                .split(/\r?\n/)
                .map(l => l.trim())
                .filter(Boolean)
        }
        if (ext === '.csv' || ext === '.tsv') {
            const sep = ext === '.csv' ? ',' : '\t'
            return raw
                .split(/\r?\n/)
                .map(line => line.split(sep)[0])
                .filter(Boolean)
        }
    }
    throw new Error('Provide a list of strings or a valid .txt, .csv, or .tsv file path')
}

/**
 * Perform sentiment analysis on input data.
 */
export async function sentimentAnalysis(
    inputData: string[] | string,
    client: CoreClient,
): Promise<SentimentResult> {
    const texts = getStrings(inputData)
    const fast = texts.length <= 200
    const sentimentProcess = new Sentiment({ fast })
    const analyzer = new Analyzer({
        datasets: { dataset: texts },
        processes: [sentimentProcess],
        client,
        fast,
    })
    const res = await analyzer.run()
    return res.sentiment
}

/**
 * Allocate themes to texts, optionally with provided seed themes.
 */
export async function themeAllocation(
    inputData: string[] | string,
    client?: CoreClient,
    themes?: string[],
): Promise<ThemeAllocationResult> {
    const texts = getStrings(inputData)
    const fast = texts.length <= 200
    const proc = new ThemeAllocation({ themes })
    const analyzer = new Analyzer({
        datasets: { dataset: texts },
        processes: [proc],
        client: client ?? new CoreClient(),
        fast,
    })
    const res = await analyzer.run()
    return res.themeAllocation
}

/**
 * Perform clustering analysis on input data.
 */
export async function clusterAnalysis(
    inputData: string[] | string,
    client: CoreClient,
): Promise<ClusterResult> {
    const texts = getStrings(inputData)
    const fast = texts.length <= 200
    const analyzer = new Analyzer({
        datasets: { dataset: texts },
        processes: processes(new Cluster()),
        client,
        fast,
    })
    const res = await analyzer.run()
    return res.cluster
}
