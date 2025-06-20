import { describe, it, expect } from 'vitest'
import { setupPolly } from './setupPolly'
import { getStrings, themeAllocation, clusterAnalysis } from '../src/starters'
import { ClusterResult } from '../src/results/ClusterResult'
import { ThemeAllocationResult } from '../src/results/ThemeAllocationResult'

const clientId = process.env.PULSE_CLIENT_ID
const clientSecret = process.env.PULSE_CLIENT_SECRET

const skip = !clientId || !clientSecret

describe('getStrings', () => {
    it('returns array as-is', () => {
        const input = ['a', 'b']
        expect(getStrings(input)).toEqual(input)
    })
    it('throws on invalid input', () => {
        expect(() => getStrings('nonexistent.txt')).toThrow()
    })
})

describe('starters', { skip }, () => {
    describe('themeAllocation', () => {
        setupPolly()
        it('allocates themes implicitly', { timeout: 30_000 }, async () => {
            const reviews = ['good', 'bad']
            const res = await themeAllocation(reviews)
            expect(res).toBeInstanceOf(ThemeAllocationResult)
            const single = res.assignSingle()
            expect(Object.keys(single)).toHaveLength(reviews.length)
            const multi = res.assignMulti(2)
            expect(multi).toHaveLength(reviews.length)
        })

        it('allocates themes explicitly', { timeout: 30_000 }, async () => {
            const reviews = ['good', 'bad']
            const themes = ['positive', 'negative']
            const res = await themeAllocation(reviews, { themes })
            expect(res).toBeInstanceOf(ThemeAllocationResult)
            const single = res.assignSingle()
            expect(Object.keys(single)).toHaveLength(reviews.length)
            const multi = res.assignMulti(2)
            expect(multi).toHaveLength(reviews.length)
        })
    })

    describe('clusterAnalysis starter', () => {
        setupPolly()
        it('returns ClusterResult instance', async () => {
            const reviews = ['x', 'y']
            const res = await clusterAnalysis(reviews)
            expect(res).toBeInstanceOf(ClusterResult)
        })
    })
})
