# Product Overview

@rwai/pulse is a TypeScript client library for the RWAI Pulse API, providing text analysis
capabilities including:

- Sentiment analysis
- Theme generation and allocation
- Text clustering
- Similarity comparison
- Text embeddings
- Summary generation

The library offers two primary interfaces:

1. **Starter helpers** - Simple functions for common use cases (sentimentAnalysis, themeAllocation,
   clusterAnalysis, summarize)
2. **Workflow DSL** - Fluent API for composing complex analysis pipelines with multiple processing
   steps

The library automatically optimizes performance using "fast mode" for datasets with 200 or fewer
texts.

## Authentication

Uses OAuth2 with support for:

- Client Credentials flow
- Authorization Code with PKCE
- Auto-detection of auth method

## Key Design Principles

- Type-safe API with full TypeScript support
- Tree-shakeable exports for minimal bundle size
- Dual ESM/CJS distribution
- Process-based architecture with dependency resolution
- Result objects with helper methods for data access
