import { describe, it, expect } from 'vitest'
import { Analyzer } from '../src/analyzer'
import { ThemeGeneration } from '../src/processes/ThemeGeneration'
import { ThemeAllocation } from '../src/processes/ThemeAllocation'
import { ThemeExtraction } from '../src/processes/ThemeExtraction'
import type { Process, ContextBase } from '../src/processes/types'
import type { CoreClient } from '../src/core/clients/CoreClient'

describe('Analyzer resolveDependencies', () => {
    it('injects ThemeGeneration when ThemeAllocation without themes provided', () => {
        const alloc = new ThemeAllocation()
        const analyzer = new Analyzer({
            datasets: { dataset: [] },
            processes: [alloc],
            client: {} as CoreClient,
        })
        expect(analyzer.processes[0]).toBeInstanceOf(ThemeGeneration)
        expect(analyzer.processes[1]).toBe(alloc)
    })

    it('injects only one ThemeGeneration for multiple dependent processes', () => {
        const alloc = new ThemeAllocation()
        const extract = new ThemeExtraction()
        const analyzer = new Analyzer({
            datasets: { dataset: [] },
            processes: [alloc, extract],
            client: {} as CoreClient,
        })
        const gens = analyzer.processes.filter(p => p instanceof ThemeGeneration)
        expect(gens).toHaveLength(1)
        expect(analyzer.processes).toEqual([gens[0], alloc, extract])
    })

    it('throws on missing non-themeGeneration dependency', () => {
        class Dummy implements Process<string, number> {
            id = 'dummy'
            name = 'dummy'
            dependsOn = ['missing']
            run(): number {
                return 0
            }
        }
        expect(
            () =>
                new Analyzer({
                    datasets: { dataset: [] },
                    processes: [new Dummy()],
                    client: {} as CoreClient,
                }),
        ).toThrowError("Missing dependency process 'missing'")
    })
})

describe('Analyzer run and AnalysisResult', () => {
    it('runs simple processes in order and maps results', async () => {
        class P1 implements Process<string, number> {
            id = 'p1'
            name = 'p1'
            dependsOn: string[] = []
            run(): number {
                return 1
            }
        }
        class P2 implements Process<string, number> {
            id = 'p2'
            name = 'p2'
            dependsOn = ['p1']
            run(ctx: ContextBase): number {
                return (ctx.datasets.p1 as number) + 1
            }
        }
        const analyzer = new Analyzer({
            datasets: { dataset: [] },
            processes: [new P1(), new P2()],
            client: {} as CoreClient,
        })
        const res = await analyzer.run()
        expect(res.p1).toBe(1)
        expect(res.p2).toBe(2)
    })
})
