import { describe, it, expect, vi } from 'vitest'
import { transposeView } from './structural'
import type { NDView } from '../../core/view'
import type { Headers } from './headers'

describe('transposeView', () => {
    it('calls transpose on the view with default axes and returns undefined headers when none provided', () => {
        const transposed = Symbol('transposed')
        const view = {
            transpose: vi.fn().mockReturnValue(transposed),
            rank: 3,
        } as unknown as NDView<number>

        const result = transposeView(view, undefined)

        expect(view.transpose).toHaveBeenCalledWith(0, 1)
        expect(result.view).toBe(transposed)
        expect(result.headers).toBeUndefined()
    })

    it('preserves headers reference when rank < 2', () => {
        const transposed = Symbol('transposed')
        const view = {
            transpose: vi.fn().mockReturnValue(transposed),
            rank: 1,
        } as unknown as NDView<number>

        const headers: Headers = [
            [
                [{ key: 'label', type: 's', value: 'a' }],
                [{ key: 'label', type: 's', value: 'b' }],
                [{ key: 'label', type: 's', value: 'c' }],
            ],
        ]
        const result = transposeView(view, headers)

        expect(view.transpose).toHaveBeenCalledWith(0, 1)
        expect(result.view).toBe(transposed)
        expect(result.headers).toBe(headers)
    })

    it('swaps two header axes when rank >= 2', () => {
        const transposed = Symbol('transposed')
        const view = {
            transpose: vi.fn().mockReturnValue(transposed),
            rank: 2,
        } as unknown as NDView<number>

        const headers: Headers = [
            [
                [{ key: 'label', type: 's', value: 'h00' }],
                [{ key: 'label', type: 's', value: 'h01' }],
            ],
            [
                [{ key: 'label', type: 's', value: 'h10' }],
                [{ key: 'label', type: 's', value: 'h11' }],
            ],
        ]
        const result = transposeView(view, headers)

        expect(view.transpose).toHaveBeenCalledWith(0, 1)
        expect(result.view).toBe(transposed)
        expect(result.headers).not.toBe(headers)
        expect(result.headers).toEqual([
            [
                [{ key: 'label', type: 's', value: 'h10' }],
                [{ key: 'label', type: 's', value: 'h11' }],
            ],
            [
                [{ key: 'label', type: 's', value: 'h00' }],
                [{ key: 'label', type: 's', value: 'h01' }],
            ],
        ])
        // original headers unchanged
        expect(headers).toEqual(headers)
    })

    it('uses custom axis indices for transpose and header swap', () => {
        const transposed = Symbol('transposed')
        const view = {
            transpose: vi.fn().mockReturnValue(transposed),
            rank: 3,
        } as unknown as NDView<number>

        const headers: Headers = [
            [[{ key: 'label', type: 's', value: 'h0' }]],
            [[{ key: 'label', type: 's', value: 'h1' }]],
            [[{ key: 'label', type: 's', value: 'h2' }]],
        ]
        const result = transposeView(view, headers, 1, 2)

        expect(view.transpose).toHaveBeenCalledWith(1, 2)
        expect(result.view).toBe(transposed)
        expect(result.headers).toEqual([
            [[{ key: 'label', type: 's', value: 'h0' }]],
            [[{ key: 'label', type: 's', value: 'h2' }]],
            [[{ key: 'label', type: 's', value: 'h1' }]],
        ])
    })
})
