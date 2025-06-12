import { describe, it, expect } from 'vitest'
import {
    isHeaderRecord,
    type HeaderRecord,
    type HeaderRecordString,
    type HeaderRecordNumber,
    type HeaderRecordBoolean,
    type HeaderRecordDate,
    type HeaderRecordJson,
    isHeaderRecordString,
    isHeaderRecordNumber,
    isHeaderRecordBoolean,
    isHeaderRecordDate,
    isHeaderRecordJson,
    labelsToDimension,
    headersFromLabels,
    transposeHeaders,
    reshapeHeaders,
    sliceHeaders,
    appendDimension,
    prependDimension,
    removeDimension,
    type Headers,
} from './headers'

describe('isHeaderRecord', () => {
    it('returns true for HeaderRecordString', () => {
        const record: HeaderRecordString = {
            key: 'label',
            type: 's',
            value: 'test',
        }
        expect(isHeaderRecord(record)).toBe(true)
    })

    it('returns true for HeaderRecordNumber', () => {
        const record: HeaderRecordNumber = {
            key: 'count',
            type: 'n',
            value: 42,
        }
        expect(isHeaderRecord(record)).toBe(true)
    })

    it('returns true for HeaderRecordBoolean', () => {
        const record: HeaderRecordBoolean = {
            key: 'locked',
            type: 'b',
            value: false,
        }
        expect(isHeaderRecord(record)).toBe(true)
    })

    it('returns true for HeaderRecordDate', () => {
        const date = new Date()
        const record: HeaderRecordDate = {
            key: 'updated_at',
            type: 'd',
            value: date,
        }
        expect(isHeaderRecord(record)).toBe(true)
    })

    it('returns true for HeaderRecordJson', () => {
        const jsonString = JSON.stringify({ a: 1 })
        const record: HeaderRecordJson = {
            key: 'data',
            type: 'j',
            value: jsonString,
        }
        expect(isHeaderRecord(record)).toBe(true)
    })

    it('returns false for unknown type', () => {
        const record = {
            key: 'unknown',
            type: 'x',
            value: 'whatever',
        } as unknown as HeaderRecord
        expect(isHeaderRecord(record)).toBe(false)
    })
})

describe('isHeaderRecordString', () => {
    it("returns true for records with type 's'", () => {
        const record: HeaderRecord = {
            key: 'myString',
            type: 's',
            value: 'hello',
        }
        expect(isHeaderRecordString(record)).toBe(true)
    })

    it("returns false for records with type 'n', 'b', 'd', or 'j'", () => {
        const cases: HeaderRecord[] = [
            { key: 'num', type: 'n', value: 123 },
            { key: 'bool', type: 'b', value: false },
            { key: 'date', type: 'd', value: new Date() },
            { key: 'json', type: 'j', value: JSON.stringify({}) },
        ]
        cases.forEach(rec => {
            expect(isHeaderRecordString(rec)).toBe(false)
        })
    })
})

describe('isHeaderRecordNumber', () => {
    it("returns true for records with type 'n'", () => {
        const record: HeaderRecord = {
            key: 'myNumber',
            type: 'n',
            value: 42,
        }
        expect(isHeaderRecordNumber(record)).toBe(true)
    })

    it("returns false for records with type 's', 'b', 'd', or 'j'", () => {
        const cases: HeaderRecord[] = [
            { key: 'str', type: 's', value: 'hello' },
            { key: 'bool', type: 'b', value: true },
            { key: 'date', type: 'd', value: new Date() },
            { key: 'json', type: 'j', value: JSON.stringify({}) },
        ]
        cases.forEach(rec => {
            expect(isHeaderRecordNumber(rec)).toBe(false)
        })
    })
})

describe('isHeaderRecordBoolean', () => {
    it("returns true for records with type 'b'", () => {
        const record: HeaderRecord = {
            key: 'myBoolean',
            type: 'b',
            value: true,
        }
        expect(isHeaderRecordBoolean(record)).toBe(true)
    })

    it("returns false for records with type 's', 'n', 'd', or 'j'", () => {
        const cases: HeaderRecord[] = [
            { key: 'str', type: 's', value: 'hello' },
            { key: 'num', type: 'n', value: 123 },
            { key: 'date', type: 'd', value: new Date() },
            { key: 'json', type: 'j', value: JSON.stringify({}) },
        ]
        cases.forEach(rec => {
            expect(isHeaderRecordBoolean(rec)).toBe(false)
        })
    })
})

describe('isHeaderRecordDate', () => {
    it("returns true for records with type 'd'", () => {
        const date = new Date()
        const record: HeaderRecord = {
            key: 'myDate',
            type: 'd',
            value: date,
        }
        expect(isHeaderRecordDate(record)).toBe(true)
    })

    it("returns false for records with type 's', 'n', 'b', or 'j'", () => {
        const cases: HeaderRecord[] = [
            { key: 'str', type: 's', value: 'hello' },
            { key: 'num', type: 'n', value: 123 },
            { key: 'bool', type: 'b', value: false },
            { key: 'json', type: 'j', value: JSON.stringify({}) },
        ]
        cases.forEach(rec => {
            expect(isHeaderRecordDate(rec)).toBe(false)
        })
    })
})

describe('isHeaderRecordJson', () => {
    it("returns true for records with type 'j'", () => {
        const jsonString = JSON.stringify({ a: 1 })
        const record: HeaderRecord = {
            key: 'myJson',
            type: 'j',
            value: jsonString,
        }
        expect(isHeaderRecordJson(record)).toBe(true)
    })

    it("returns false for records with type 's', 'n', 'b', or 'd'", () => {
        const cases: HeaderRecord[] = [
            { key: 'str', type: 's', value: 'hello' },
            { key: 'num', type: 'n', value: 123 },
            { key: 'bool', type: 'b', value: false },
            { key: 'date', type: 'd', value: new Date() },
        ]
        cases.forEach(rec => {
            expect(isHeaderRecordJson(rec)).toBe(false)
        })
    })
})

describe('headers utility functions', () => {
    describe('labelsToDimension', () => {
        it('converts labels to a dimension object', () => {
            const labels = ['Label One', 'Label Two']
            const dimension = labelsToDimension(labels)
            expect(dimension).toEqual([
                [{ key: 'label', value: 'Label One', type: 's' }],
                [{ key: 'label', value: 'Label Two', type: 's' }],
            ])
        })

        it('returns an empty dimension for empty labels', () => {
            const dimension = labelsToDimension([])
            expect(dimension).toEqual([])
        })
    })

    describe('headersFromLabels', () => {
        it('creates headers from labels', () => {
            const labels = ['label1', 'label2']
            const headers = headersFromLabels(labels)
            expect(headers).toEqual([
                [
                    [{ key: 'label', type: 's', value: 'label1' }],
                    [{ key: 'label', type: 's', value: 'label2' }],
                ],
            ])
        })

        it('returns empty headers for empty labels', () => {
            const headers = headersFromLabels([])
            expect(headers).toEqual([[]])
        })
    })

    describe('transposeHeaders', () => {
        it('transposes a two-dimensional headers array', () => {
            const headers: Headers = [
                [
                    [
                        { key: 'label', type: 's', value: 'label1' },
                        { key: 'count', type: 'n', value: 10 },
                    ],
                ],
                [
                    [
                        { key: 'label', type: 's', value: 'label2' },
                        { key: 'count', type: 'n', value: 20 },
                    ],
                ],
            ]
            const transposed = transposeHeaders(headers)
            expect(transposed).toEqual([
                [
                    [
                        { key: 'label', type: 's', value: 'label2' },
                        { key: 'count', type: 'n', value: 20 },
                    ],
                ],
                [
                    [
                        { key: 'label', type: 's', value: 'label1' },
                        { key: 'count', type: 'n', value: 10 },
                    ],
                ],
            ])
        })

        it('returns an empty array for empty headers', () => {
            const transposed = transposeHeaders([[[]]], 0, 0)
            expect(transposed).toEqual([[[]]])
        })
    })

    describe('reshapeHeaders', () => {
        it('removes headers when new shape is supplied', () => {
            const headers: Headers = [
                [
                    [
                        { key: 'label', type: 's', value: 'label1' },
                        { key: 'count', type: 'n', value: 10 },
                    ],
                ],
                [
                    [
                        { key: 'label', type: 's', value: 'label2' },
                        { key: 'count', type: 'n', value: 20 },
                    ],
                ],
            ]
            const newShape = [2, 1]
            const reshaped = reshapeHeaders(headers, newShape)
            expect(reshaped).not.toBeDefined()
        })

        it('returns the same headers when the same shape is given', () => {
            const headers: Headers = [
                [
                    [
                        { key: 'label', type: 's', value: 'label1' },
                        { key: 'count', type: 'n', value: 10 },
                    ],
                    [
                        { key: 'label', type: 's', value: 'label3' },
                        { key: 'count', type: 'n', value: 10 },
                    ],
                ],
                [
                    [
                        { key: 'label', type: 's', value: 'label2' },
                        { key: 'count', type: 'n', value: 20 },
                    ],
                    [
                        { key: 'label', type: 's', value: 'label4' },
                        { key: 'count', type: 'n', value: 20 },
                    ],
                ],
            ]
            const newShape = [2, 2]
            const reshaped = reshapeHeaders(headers, newShape)
            expect(reshaped).toEqual(headers)
        })
    })

    describe.skip('sliceHeaders', () => {
        it('slices headers along the first axis', () => {
            const headers: Headers = [
                [
                    [{ key: 'label', type: 's', value: 'label1' }],
                    [{ key: 'label', type: 's', value: 'label2' }],
                ],
                [
                    [{ key: 'count', type: 'n', value: 10 }],
                    [{ key: 'count', type: 'n', value: 20 }],
                ],
            ]
            const sliced = sliceHeaders(headers, 0, 1)
            expect(sliced).toEqual([
                [[{ key: 'label', type: 's', value: 'label2' }]],
                [[{ key: 'count', type: 'n', value: 20 }]],
            ])
        })

        it('returns empty headers when slicing beyond available data', () => {
            const headers: Headers = [
                [
                    [{ key: 'label', type: 's', value: 'label1' }],
                    [{ key: 'label', type: 's', value: 'label2' }],
                ],
            ]
            const sliced = sliceHeaders(headers, 0, 5)
            expect(sliced).toEqual([[]])
        })
    })
    describe('appendDimension', () => {
        it('appends a new dimension to headers', () => {
            const headers: Headers = [
                [
                    [{ key: 'label', type: 's', value: 'label1' }],
                    [{ key: 'label', type: 's', value: 'label2' }],
                ],
            ]
            const newHeaders = appendDimension(headers, [
                [{ key: 'label', type: 's', value: 'row1' }],
            ])
            expect(newHeaders).toEqual([
                [
                    [{ key: 'label', type: 's', value: 'label1' }],
                    [{ key: 'label', type: 's', value: 'label2' }],
                ],
                [[{ key: 'label', type: 's', value: 'row1' }]],
            ])
        })
    })
    describe.skip('prependDimension', () => {
        it('prepends a new dimension to headers', () => {
            const headers: Headers = [
                [
                    [{ key: 'label', type: 's', value: 'label1' }],
                    [{ key: 'label', type: 's', value: 'label2' }],
                ],
            ]
            const newHeaders = prependDimension(headers, [
                [{ key: 'label', type: 's', value: 'row1' }],
            ])
            expect(newHeaders).toEqual([
                [[{ key: 'label', type: 's', value: 'row1' }]],
                [
                    [{ key: 'newLabel', type: 's', value: '' }],
                    [{ key: 'label', type: 's', value: 'label1' }],
                ],
            ])
        })
    })

    describe.skip('removeDimension', () => {
        it('removes a dimension from headers', () => {
            const headers: Headers = [
                [
                    [{ key: 'label', type: 's', value: 'label1' }],
                    [{ key: 'label', type: 's', value: 'label2' }],
                ],
                [
                    [{ key: 'count', type: 'n', value: 10 }],
                    [{ key: 'count', type: 'n', value: 20 }],
                ],
            ]
            const newHeaders = removeDimension(headers, 0)
            expect(newHeaders).toEqual([
                [{ key: 'label', type: 's', value: 'label1' }],
                [{ key: 'label', type: 's', value: 'label2' }],
            ])
        })

        it('returns empty headers when removing the last dimension', () => {
            const headers: Headers = [[[{ key: 'label', type: 's', value: 'label1' }]]]
            const newHeaders = removeDimension(headers, 0)
            expect(newHeaders).toEqual([[]])
        })
    })
})
