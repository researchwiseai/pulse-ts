import { describe, it, expect } from 'vitest'
import { setupPolly } from './setupPolly'
import { Workflow } from '../src/dsl'
import { CoreClient } from '../src/core/client'
import { ClientCredentialsAuth } from '../src/auth'
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
        it('runs theme_allocation step', async () => {
            const comments = ['good', 'bad', 'meh']
            const existing = ['Pos', 'Neg']
            const wf = new Workflow()
                .source('comments', comments)
                .source('themes', existing)
                .theme_allocation({ inputs: 'comments', themesFrom: 'themes' })
            const results = await wf.run(undefined, { client })
            expect(results).toHaveProperty('theme_allocation')
            const ta = results.theme_allocation
            expect(ta).not.toBeInstanceOf(Job)
            if ((ta as any).themes) {
                expect(Array.isArray((ta as any).themes)).toBe(true)
            }
            if ((ta as any).sentiments) {
                expect(Array.isArray((ta as any).sentiments)).toBe(true)
            }
        })
    })
}
