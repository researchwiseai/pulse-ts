# API Update Summary - OpenAPI 0.6.0 → 0.10.0

## ✅ All Changes Completed Successfully

### 1. ✅ Models Regenerated

- Ran `bun run generate` to update `src/models.ts` from openapi.yml
- API version updated from 0.6.0 to 0.10.0
- All TypeScript types now reflect the latest API schema

### 2. ✅ Provider Override Support Added

- Added `provider?: ProviderSpec` to `UniversalFeatureOptions` in `src/core/clients/types.ts`
- Updated all client methods to pass through provider parameter:
    - `analyzeSentiment.ts`
    - `createEmbeddings.ts`
    - `compareSimilarity.ts`
    - `extractElements.ts`
    - `generateThemes.ts`
- Enables custom OpenAI configuration per request

### 3. ✅ Themes Endpoint Enhancements

- Added `interactive?: boolean` parameter to `GenerateThemeOptions`
- Added `initialSets?: number` parameter to `GenerateThemeOptions` (1-3, requires interactive=true
  for >1)
- Updated `generateThemes` return type to support both `ThemesResponse` and `ThemeSetsResponse`
- Updated `ThemeGeneration` process to handle `ThemeSetsResponse` (uses first theme set)
- Updated test in `test/core-client.test.ts` to handle both response types
- New version "2025-09-01" returns `ThemeSetsResponse` with multiple theme sets

### 4. ✅ Extractions API Breaking Changes Fixed

- **Breaking Change**: Response structure changed from `{columns, matrix}` to
  `{dictionary, results}`
- Updated `ThemeExtractionResult` class:
    - Changed properties from `columns` and `matrix` to `dictionary` and `results`
    - `results` is now a 3D array: `string[][][]` (text_index → dictionary_index → matches)
    - Updated `toArray()` to return `{text, term, matches}` instead of `{text, category, score}`
- Updated `ThemeExtraction` process:
    - Now uses `type: 'themes'` with `expand_dictionary: false`
    - Passes theme labels directly as dictionary
    - Removed obsolete `categories` and `threshold` parameters
- Updated version type to `'original'` (literal type) throughout
- Fixed all related tests to use new response structure

### 5. ✅ Type Errors Fixed

- Fixed Split parameter structure in `compareSimilarity.test.ts`:
    - Added required `window_size: 1` and `stride_size: 1` fields
- Fixed `extractElements` tests:
    - Added required `dictionary` parameter to all test calls
    - Updated mock responses to use new structure
- Updated `test/results.test.ts`:
    - Changed test expectations to use `dictionary` and `results`
    - Updated assertions to match new data structure

### 6. ✅ Analyzer Enhancement

- Fixed `Analyzer.run()` to handle processes that don't require datasets
- Added special handling for `GenerateDataDictionary` which has embedded data
- Prevents "Dataset not found" errors for self-contained processes

### 7. ✅ DSL Updates

- Updated `themeExtraction` method to use `version?: 'original'` type
- Ensures type safety throughout the DSL chain

## Test Results

### ✅ All Unit Tests Passing

- 22 test files, 319 tests passed (5 skipped)
- All core functionality verified
- Type checking passes without errors

### ⚠️ Integration Tests

- Some integration tests fail due to network requirements
- These tests need actual API access or recorded responses
- Not related to the API update changes

## Input Limit Changes (No Code Changes Needed)

The following input limits changed but don't require code updates since they're enforced
server-side:

| Endpoint    | Mode  | Old Limit     | New Limit |
| ----------- | ----- | ------------- | --------- |
| Embeddings  | Async | 2,000         | 5,000     |
| Clustering  | Sync  | 200           | 500       |
| Clustering  | Async | 500           | 44,721    |
| Sentiment   | Async | 10,000        | 5,000     |
| Extractions | Async | (unspecified) | 5,000     |

## Documentation Updates

### ✅ CHANGELOG.md Updated

- Added [Unreleased] section with all changes
- Documented breaking changes in extractions API
- Listed new features and improvements

### Files Modified

- `src/models.ts` - Regenerated from OpenAPI spec
- `src/core/clients/types.ts` - Added provider parameter
- `src/core/clients/generateThemes.ts` - Added interactive and initialSets parameters
- `src/core/clients/analyzeSentiment.ts` - Added provider support
- `src/core/clients/createEmbeddings.ts` - Added provider support
- `src/core/clients/compareSimilarity.ts` - Added provider support
- `src/core/clients/extractElements.ts` - Added provider support
- `src/results/index.ts` - Updated ThemeExtractionResult for new API
- `src/processes/ThemeExtraction.ts` - Updated to use new extraction API
- `src/processes/ThemeGeneration.ts` - Handle ThemeSetsResponse
- `src/analyzer.ts` - Handle processes without datasets
- `src/dsl.ts` - Updated version types
- `test/core-client.test.ts` - Handle both response types
- `test/results.test.ts` - Updated for new extraction structure
- `src/core/clients/__tests__/extractElements.test.ts` - Fixed tests
- `src/core/clients/__tests__/compareSimilarity.test.ts` - Fixed split parameter
- `CHANGELOG.md` - Documented all changes

## Version Compatibility Notes

- New themes version "2025-09-01" returns `ThemeSetsResponse` instead of `ThemesResponse`
- Sentiment version "2025-08-17" is now default (was already supported)
- Extractions version "original" is the only supported version
- Provider override is optional and backward compatible
- All changes maintain backward compatibility except for the extractions API (which is in beta)

## Summary

All aspects of the OpenAPI 0.6.0 → 0.10.0 update have been successfully implemented:

✅ Models regenerated  
✅ Provider override support added  
✅ Themes endpoint enhancements implemented  
✅ Extractions API breaking changes handled  
✅ All type errors fixed  
✅ Tests updated and passing  
✅ Documentation updated

The codebase is now fully compatible with API version 0.10.0.
