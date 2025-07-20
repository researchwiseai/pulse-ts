import { describe, it, expect } from 'vitest'
import { setupPolly } from './setupPolly'
import { Workflow } from '../src/dsl'
import { CoreClient } from '../src/core/clients/CoreClient'
// Unit tests for DSL id uniqueness and naming behavior
describe('DSL id uniqueness and naming', () => {
    it('assigns unique ids for duplicate processes', () => {
        const wf = new Workflow().themeGeneration().themeGeneration()
        const ids = (wf as unknown as { processes: Array<{ id: string }> }).processes.map(
            (p: { id: string }) => p.id,
        )
        expect(ids).toEqual(['themeGeneration', 'themeGeneration_2'])
    })
    it('throws when using duplicate custom name', () => {
        const wf = new Workflow().themeGeneration({ name: 'x' })
        expect(() => wf.themeGeneration({ name: 'x' })).toThrowError(
            "Process name 'x' already registered",
        )
    })
    it('throws when custom name collides with source alias', () => {
        const wf = new Workflow().source('foo', [])
        expect(() => wf.themeGeneration({ name: 'foo' })).toThrowError(
            "Process name 'foo' already registered",
        )
    })
    it('throws when inputs source unknown for themeAllocation', () => {
        const wf = new Workflow()
        expect(() => wf.themeAllocation({ inputs: 'unknown', themes: ['A'] })).toThrowError(
            "Unknown inputs source for themeAllocation: 'unknown'",
        )
    })
})
import { ClientCredentialsAuth } from '../src/auth/ClientCredentialsAuth'
import { Job } from '../src/core/job'

const clientId = process.env.PULSE_CLIENT_ID
const clientSecret = process.env.PULSE_CLIENT_SECRET
const tokenUrl = process.env.PULSE_TOKEN_URL
const audience = process.env.PULSE_AUDIENCE
const baseUrl = audience ?? process.env.PULSE_BASE_URL
if (!clientId || !clientSecret || !tokenUrl || !audience) {
    describe.skip('DSL workflow (requires credentials)', () => {})
} else {
    const auth = new ClientCredentialsAuth({ clientId, clientSecret, tokenUrl, audience })
    const client = new CoreClient({ baseUrl: baseUrl as string, auth })

    describe('DSL end-to-end', () => {
        setupPolly()
        it.skip('runs themeAllocation step', async () => {
            const comments = ['good', 'bad', 'meh']
            const existing = ['Pos', 'Neg']
            const wf = new Workflow()
                .source('comments', comments)
                .source('themes', existing)
                .themeAllocation({ inputs: 'comments', themesFrom: 'themes' })
            const results = await wf.run({ client, datasets: {} })
            expect(results).toHaveProperty('themeAllocation')
            const ta = results.themeAllocation
            expect(ta).not.toBeInstanceOf(Job)
            if ((ta as Record<string, unknown>).themes) {
                expect(Array.isArray((ta as Record<string, unknown>).themes)).toBe(true)
            }
            if ((ta as Record<string, unknown>).sentiments) {
                expect(Array.isArray((ta as Record<string, unknown>).sentiments)).toBe(true)
            }
        })
    })
}
