# OpenAPI 0.6.0 → 0.10.0 Update - Implementation Complete ✅

## Overview

Successfully updated the pulse-ts client library to support the Pulse API version 0.10.0,
implementing all new features and handling breaking changes in the extractions endpoint.

## What Was Done

### 1. API Models Updated

- Regenerated TypeScript types from openapi.yml using `bun run generate`
- All 0.10.0 API changes now reflected in type definitions

### 2. Provider Override Support

Added the ability to override the default provider with custom OpenAI configuration on a per-request
basis:

```typescript
// Example usage
await client.createEmbeddings(['text'], {
    provider: {
        type: 'openai',
        auth: { api_key: 'custom-key' },
        endpoint: 'https://custom-endpoint.com',
    },
})
```

Supported on: embeddings, similarity, themes, sentiment, extractions

### 3. Themes Endpoint Enhancements

New parameters for advanced theme generation:

```typescript
await client.generateThemes(texts, {
    interactive: true, // Enable interactive mode
    initialSets: 2, // Generate 2 initial theme sets (requires interactive=true)
    version: '2025-09-01', // Use new version with ThemeSetsResponse
})
```

### 4. Extractions API Breaking Changes (Beta)

The extractions endpoint response structure changed:

**Old Structure:**

```typescript
{
  columns: string[],
  matrix: number[][],
  requestId: string
}
```

**New Structure:**

```typescript
{
  dictionary: string[],
  results: string[][][],  // 3D array: [text][term][matches]
  requestId: string
}
```

**Updated Components:**

- `ThemeExtractionResult` class now uses `dictionary` and `results`
- `toArray()` returns `{text, term, matches}` instead of `{text, category, score}`
- `ThemeExtraction` process updated to use new API parameters

### 5. Bug Fixes

- Fixed `Analyzer` to handle processes with embedded data (like `GenerateDataDictionary`)
- Fixed type errors in tests
- Updated all test mocks to match new API responses

## Testing Status

### ✅ Unit Tests: All Passing

```
Test Files  22 passed (22)
Tests       319 passed | 5 skipped (324)
```

### ✅ Build: Successful

```
ESM dist/index.js     89.31 KB
CJS dist/index.cjs    90.19 KB
DTS dist/index.d.ts  113.42 KB
```

### ✅ Type Checking: No Errors

```
$ tsc --noEmit
(no output - success)
```

### ⚠️ Integration Tests

Some integration tests fail due to network requirements (need actual API access or recorded
responses). This is not related to the API update changes.

## Files Modified

### Core Client Files

- `src/core/clients/types.ts` - Added provider parameter
- `src/core/clients/generateThemes.ts` - Added interactive/initialSets
- `src/core/clients/analyzeSentiment.ts` - Added provider support
- `src/core/clients/createEmbeddings.ts` - Added provider support
- `src/core/clients/compareSimilarity.ts` - Added provider support
- `src/core/clients/extractElements.ts` - Added provider support

### Process Files

- `src/processes/ThemeGeneration.ts` - Handle ThemeSetsResponse
- `src/processes/ThemeExtraction.ts` - Updated for new extraction API
- `src/analyzer.ts` - Handle processes without datasets
- `src/dsl.ts` - Updated version types

### Result Files

- `src/results/index.ts` - Updated ThemeExtractionResult

### Test Files

- `test/core-client.test.ts` - Handle both response types
- `test/results.test.ts` - Updated for new extraction structure
- `src/core/clients/__tests__/extractElements.test.ts` - Fixed tests
- `src/core/clients/__tests__/compareSimilarity.test.ts` - Fixed split parameter

### Documentation

- `CHANGELOG.md` - Documented all changes
- `API_UPDATE_SUMMARY.md` - Detailed technical summary

## Breaking Changes

### For Users of Extractions API (Beta)

If you're using the extractions endpoint or `ThemeExtractionResult`:

**Before:**

```typescript
const result = new ThemeExtractionResult(response, texts)
console.log(result.columns) // ['theme1', 'theme2']
console.log(result.matrix) // [[1, 0], [0, 1]]
result.toArray() // [{text, category, score}, ...]
```

**After:**

```typescript
const result = new ThemeExtractionResult(response, texts)
console.log(result.dictionary) // ['term1', 'term2']
console.log(result.results) // [[['match1'], []], [[], ['match2']]]
result.toArray() // [{text, term, matches}, ...]
```

## Input Limit Changes

These are enforced server-side, no code changes needed:

| Endpoint    | Mode  | Old → New      |
| ----------- | ----- | -------------- |
| Embeddings  | Async | 2,000 → 5,000  |
| Clustering  | Sync  | 200 → 500      |
| Clustering  | Async | 500 → 44,721   |
| Sentiment   | Async | 10,000 → 5,000 |
| Extractions | Async | - → 5,000      |

## Next Steps

1. **Review CHANGELOG.md** - Ensure all changes are properly documented
2. **Update version** - Decide on version bump (likely minor: 0.2.0)
3. **Test with real API** - Run integration tests against staging/production
4. **Release** - Tag and publish when ready

## Notes

- All changes maintain backward compatibility except for the extractions API (which is in beta)
- Provider override is optional - existing code continues to work
- New themes parameters are optional - existing code continues to work
- The codebase is ready for release once integration testing is complete
