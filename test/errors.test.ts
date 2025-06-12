import { describe, it, expect } from 'vitest'
import { PulseAPIError, TimeoutError, NetworkError } from '../src/errors'

describe('PulseAPIError', () => {
    it('captures status, statusText, and body correctly', () => {
        const fakeResponse = { status: 400, statusText: 'Bad Request' } as Response
        const body = { error: 'oops' }
        const err = new PulseAPIError(fakeResponse, body)
        expect(err.name).toBe('PulseAPIError')
        expect(err.message).toBe('Pulse API Error: 400 Bad Request')
        expect(err.status).toBe(400)
        expect(err.statusText).toBe('Bad Request')
        expect(err.body).toBe(body)
    })
})

describe('TimeoutError', () => {
    it('formats message correctly', () => {
        const err = new TimeoutError('http://x', 1000)
        expect(err.message).toBe('Request to http://x timed out after 1000ms')
        expect(err.name).toBe('TimeoutError')
    })
})

describe('NetworkError', () => {
    it('formats message correctly', () => {
        const err = new NetworkError('http://x', new Error('boom'))
        expect(err.message).toBe('Network error while requesting http://x: boom')
        expect(err.name).toBe('NetworkError')
    })
})
