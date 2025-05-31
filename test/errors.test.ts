import { describe, it, expect } from 'vitest'
import { PulseAPIError } from '../src/errors'

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