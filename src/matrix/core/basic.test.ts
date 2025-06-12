import { asQInt } from './basic'
import { describe, it, expect } from 'vitest'

describe('basic: QInt parsing', () => {
    it('parses valid integers within range', () => {
        expect(asQInt(0)).toBe(0)
        expect(asQInt(127)).toBe(127)
        expect(asQInt(-127)).toBe(-127)
    })
    it('throws on non-integers or out-of-range values', () => {
        expect(() => asQInt(1.5)).toThrow()
        expect(() => asQInt(128)).toThrow()
        expect(() => asQInt(-128)).toThrow()
        expect(() => asQInt(Number.NaN)).toThrow()
    })
})
