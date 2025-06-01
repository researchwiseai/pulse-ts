/**
 * High-level orchestrator for Pulse API processes.
 */
import type { CoreClient } from './core/client'
import type { Process } from './processes'
import {
  ThemeGeneration,
  SentimentProcess,
  ThemeAllocation,
  Cluster,
  ThemeExtraction,
} from './processes'
import {
  ThemeGenerationResult,
  SentimentResult,
  ThemeAllocationResult,
  ClusterResult,
  ThemeExtractionResult,
} from './results'

/** Options for Analyzer. */
export interface AnalyzerOptions {
  /** Array of input texts. */
  dataset: string[]
  /** Processing steps to execute. */
  processes?: Process[]
  /** Core client to call API endpoints. */
  client: CoreClient
  /** Fast mode flag; if true, use fast synchronous endpoints where supported. */
  fast?: boolean
}

export class Analyzer {
  dataset: string[]
  processes: Process[]
  fast: boolean
  client: CoreClient
  /** In-memory results mapping process id to wrapped result. */
  results: Record<string, any>

  constructor(opts: AnalyzerOptions) {
    this.dataset = opts.dataset
    this.processes = opts.processes ?? []
    this.fast = opts.fast ?? false
    this.client = opts.client
    this.results = {}
    this.resolveDependencies()
  }

  private resolveDependencies(): void {
    const existing = new Set(this.processes.map(p => p.id))
    const resolved: Process[] = []
    for (const proc of this.processes) {
      for (const dep of proc.dependsOn ?? []) {
        if (!existing.has(dep)) {
          if (dep === ThemeGeneration.id) {
            resolved.push(new ThemeGeneration())
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
      const raw = await proc.run(this)
      const id = proc.id
      let wrapped: any
      switch (id) {
        case ThemeGeneration.id:
          wrapped = new ThemeGenerationResult(raw, this.dataset)
          break
        case SentimentProcess.id:
          wrapped = new SentimentResult(raw, this.dataset)
          break
        case ThemeAllocation.id:
          wrapped = new ThemeAllocationResult(
            this.dataset,
            raw.themes,
            raw.assignments,
            proc instanceof ThemeAllocation ? proc.singleLabel : true,
            proc instanceof ThemeAllocation ? proc.threshold : 0.5,
            raw.similarity,
          )
          break
        case Cluster.id:
          wrapped = new ClusterResult(raw, this.dataset)
          break
        case ThemeExtraction.id:
          wrapped = new ThemeExtractionResult(
            raw,
            this.dataset,
            proc instanceof ThemeExtraction && proc.themes ? proc.themes : [],
          )
          break
        default:
          wrapped = raw
      }
      output[id] = wrapped
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