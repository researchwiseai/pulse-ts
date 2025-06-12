import { add, sub, mul, div, pow } from './broadcast'
import { describe, it, expect } from 'vitest'

describe('utils/broadcast (binary operations)', () => {
    it('add works for scalars', () => {
        expect(add(2, 3)).toBe(5)
    })
    it('add works for scalar and array', () => {
        expect(add(1, [1, 2, 3])).toEqual([2, 3, 4])
    })
    it('add works for two arrays of same length', () => {
        expect(add([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9])
    })
    it('add broadcasts arrays of length 1', () => {
        expect(add([1], [1, 2, 3])).toEqual([2, 3, 4])
        expect(add([1, 2, 3], [1])).toEqual([2, 3, 4])
    })
    it('add throws on mismatched lengths', () => {
        expect(() => add([1, 2], [1, 2, 3])).toThrow('broadcast mismatch')
    })
    it('sub works correctly', () => {
        expect(sub(5, 2)).toBe(3)
    })
    it('mul works correctly', () => {
        expect(mul(2, 3)).toBe(6)
    })
    it('div works correctly', () => {
        expect(div(6, 2)).toBe(3)
    })
    it('pow works correctly', () => {
        expect(pow(2, 3)).toBe(8)
    })
})
