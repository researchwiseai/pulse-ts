# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Provider override support for all endpoints (embeddings, similarity, themes, sentiment,
  extractions)
- New themes endpoint parameters: `interactive` and `initialSets` for advanced theme generation
- Support for new themes API version "2025-09-01" with `ThemeSetsResponse`

### Changed

- **BREAKING**: Extractions API response structure changed from `{columns, matrix}` to
  `{dictionary, results}`
    - `ThemeExtractionResult` now uses `dictionary` and `results` (3D array) instead of `columns`
      and `matrix`
    - `toArray()` method now returns `{text, term, matches}` instead of `{text, category, score}`
- Updated API models to version 0.10.0
- Input limits updated (enforced server-side):
    - Embeddings async: 2,000 → 5,000 strings
    - Clustering sync: 200 → 500 strings
    - Clustering async: 500 → 44,721 strings
    - Sentiment async: 10,000 → 5,000 strings
    - Extractions async: added 5,000 string limit

### Fixed

- `ThemeGeneration` process now handles both `ThemesResponse` and `ThemeSetsResponse`
- `Analyzer` now properly handles processes that don't require datasets (e.g.,
  `GenerateDataDictionary`)

## [0.1.0] - 2025-06-15

- Initial pre-release of the TypeScript client
- Supports authentication helpers, CoreClient methods, starters, and the DSL
- Includes typed models generated from the OpenAPI schema
- Bundled using tsup and tested with vitest

[0.1.0]: https://github.com/rwai/pulse-ts/releases/tag/v0.1.0
