# Design Document

## Overview

This design document outlines the integration of the data dictionary generation feature into the
@rwai/pulse TypeScript client library. The feature will follow the established architectural
patterns used for other API endpoints (embeddings, themes, clustering, etc.) while accommodating the
unique characteristics of DDI Codebook generation.

The data dictionary generator analyzes 2D arrays of tabular data and produces comprehensive DDI
(Data Documentation Initiative) Codebook documentation. Unlike other endpoints, this feature only
supports asynchronous processing due to the computational complexity of analyzing large datasets.

## Architecture

### Layer Structure

The implementation follows the existing four-layer architecture:

1. **Core API Layer** (`src/core/clients/`) - Direct API communication
2. **Processing Layer** (`src/processes/`) - Process abstraction for workflow composition
3. **Results Layer** (`src/results/`) - Result wrapper with helper methods
4. **High-Level API** (`src/starters.ts`) - Simple helper functions

### Data Flow

```text
User Input (2D Array)
    ↓
Core Client Method (generateDataDictionary)
    ↓
API Request (/data-dictionary)
    ↓
Job ID (HTTP 202)
    ↓
Job Polling (/jobs/{job_id})
    ↓
DataDictionaryResponse (DDI Codebook)
    ↓
DataDictionaryResult (Wrapper with helpers)
    ↓
User Access (Variables, Value Domains, etc.)
```

## Components and Interfaces

### 1. Core Client Method

**File**: `src/core/clients/generateDataDictionary.ts`

```typescript
import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'
import type { Job } from '../job'
import { requestFeature } from './requestFeature'
import type { components } from '../../models'

export interface GenerateDataDictionaryOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
> extends UniversalFeatureOptions<Fast, AwaitJobResult> {
    title?: string
    description?: string
    context?: string
    language?: string
}

export async function generateDataDictionary<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
>(
    client: CoreClient,
    data: string[][],
    options: GenerateDataDictionaryOptions<Fast, AwaitJobResult> = {},
): Promise<
    AwaitJobResult extends false
        ? Job<components['schemas']['DataDictionaryResponse']>
        : components['schemas']['DataDictionaryResponse']
> {
    // Validate that fast mode is not requested
    if (options.fast === true) {
        throw new Error(
            'Data dictionary generation only supports asynchronous mode (fast=false or omitted)',
        )
    }

    // Build request payload
    const payload: components['schemas']['DataDictionaryRequest'] = {
        data,
        fast: false,
    }

    // Add optional metadata if provided
    if (options.title || options.description || options.context || options.language) {
        payload.options = {
            title: options.title,
            description: options.description,
            context: options.context,
            language: options.language,
        }
    }

    return requestFeature(client, '/data-dictionary', payload, { ...options, fast: false })
}
```

**Integration**: Add method to `CoreClient` class:

```typescript
// In src/core/clients/CoreClient.ts
import { generateDataDictionary } from './generateDataDictionary'

export class CoreClient {
    // ... existing methods ...

    generateDataDictionary = generateDataDictionary.bind(null, this)
}
```

### 2. Process Class

**File**: `src/processes/GenerateDataDictionary.ts`

```typescript
import type { components } from '../models'
import { DataDictionaryResult } from '../results/DataDictionaryResult'
import { staticImplements, type ContextBase, type Process, type ProcessStatic } from './types'

@staticImplements<ProcessStatic<'generateDataDictionary', DataDictionaryResult>>()
export class GenerateDataDictionary<Name extends string = 'generateDataDictionary'>
    implements Process<Name, DataDictionaryResult>
{
    static readonly id = 'generateDataDictionary'
    readonly name: Name
    dependsOn: string[] = []

    data: string[][]
    title?: string
    description?: string
    context?: string
    language?: string

    constructor(options: {
        name?: Name
        data: string[][]
        title?: string
        description?: string
        context?: string
        language?: string
    }) {
        this.name = options.name ?? (GenerateDataDictionary.id as Name)
        this.data = options.data
        this.title = options.title
        this.description = options.description
        this.context = options.context
        this.language = options.language
    }

    get id() {
        return GenerateDataDictionary.id
    }

    async run(ctx: ContextBase): Promise<DataDictionaryResult> {
        const response = await ctx.client.generateDataDictionary(this.data, {
            title: this.title,
            description: this.description,
            context: this.context,
            language: this.language,
            fast: false,
        })

        return new DataDictionaryResult(response)
    }
}
```

### 3. Result Wrapper Class

**File**: `src/results/DataDictionaryResult.ts`

```typescript
import type { components } from '../models'

type DDIVariable = components['schemas']['DDIVariable']
type DDIValueDomain = components['schemas']['DDIValueDomain']
type DDICategory = components['schemas']['DDICategory']
type DDIQuestionItem = components['schemas']['DDIQuestionItem']
type DDIUniverse = components['schemas']['DDIUniverse']
type DDIConcept = components['schemas']['DDIConcept']
type DDIMissingValues = components['schemas']['DDIMissingValues']
type DDIVariableGroup = components['schemas']['DDIVariableGroup']

export class DataDictionaryResult {
    constructor(private response: components['schemas']['DataDictionaryResponse']) {}

    // Core accessors
    get codebook() {
        return this.response.codebook
    }

    get profileVersion() {
        return this.response.profileVersion
    }

    get profileName() {
        return this.response.profileName
    }

    get requestId() {
        return this.response.requestId
    }

    get usage() {
        return this.response.usage
    }

    // Metadata accessors
    get title() {
        return this.codebook.title
    }

    get description() {
        return this.codebook.description
    }

    get creationDate() {
        return this.codebook.creationDate
    }

    get language() {
        return this.codebook.language
    }

    get qualityMetrics() {
        return this.codebook.qualityMetrics
    }

    // Variable methods
    getVariables(): DDIVariable[] {
        return this.codebook.variables ?? []
    }

    getVariableByName(name: string): DDIVariable | undefined {
        return this.getVariables().find(v => v.variableName === name)
    }

    getVariablesByType(type: DDIVariable['type']): DDIVariable[] {
        return this.getVariables().filter(v => v.type === type)
    }

    getVariablesByScaleLevel(scaleLevel: DDIVariable['scaleLevel']): DDIVariable[] {
        return this.getVariables().filter(v => v.scaleLevel === scaleLevel)
    }

    getVariablesByGroup(groupRef: string): DDIVariable[] {
        return this.getVariables().filter(v => v.groupRef === groupRef)
    }

    // Value domain methods
    getValueDomains(): DDIValueDomain[] {
        return this.codebook.valueDomains ?? []
    }

    getValueDomainById(id: string): DDIValueDomain | undefined {
        return this.getValueDomains().find(vd => vd.valueDomainId === id)
    }

    getValueDomainsByType(domainType: DDIValueDomain['domainType']): DDIValueDomain[] {
        return this.getValueDomains().filter(vd => vd.domainType === domainType)
    }

    // Category methods
    getCategories(): DDICategory[] {
        return this.codebook.categories ?? []
    }

    getCategoriesForDomain(valueDomainId: string): DDICategory[] {
        return this.getCategories()
            .filter(c => c.valueDomainId === valueDomainId)
            .sort((a, b) => a.order - b.order)
    }

    getCategoryByCode(valueDomainId: string, code: string | number): DDICategory | undefined {
        return this.getCategories().find(c => c.valueDomainId === valueDomainId && c.code === code)
    }

    // Question methods
    getQuestionItems(): DDIQuestionItem[] {
        return this.codebook.questionItems ?? []
    }

    getQuestionById(id: string): DDIQuestionItem | undefined {
        return this.getQuestionItems().find(q => q.questionId === id)
    }

    // Universe methods
    getUniverses(): DDIUniverse[] {
        return this.codebook.universes ?? []
    }

    getUniverseById(id: string): DDIUniverse | undefined {
        return this.getUniverses().find(u => u.universeId === id)
    }

    // Concept methods
    getConcepts(): DDIConcept[] {
        return this.codebook.concepts ?? []
    }

    getConceptById(id: string): DDIConcept | undefined {
        return this.getConcepts().find(c => c.conceptId === id)
    }

    // Missing values methods
    getMissingValues(): DDIMissingValues[] {
        return this.codebook.missingValues ?? []
    }

    getMissingValuesById(id: string): DDIMissingValues | undefined {
        return this.getMissingValues().find(mv => mv.missingValuesId === id)
    }

    // Variable group methods
    getVariableGroups(): DDIVariableGroup[] {
        return this.codebook.variableGroups ?? []
    }

    getVariableGroupById(id: string): DDIVariableGroup | undefined {
        return this.getVariableGroups().find(g => g.groupId === id)
    }

    getVariableGroupsByType(groupType: DDIVariableGroup['groupType']): DDIVariableGroup[] {
        return this.getVariableGroups().filter(g => g.groupType === groupType)
    }

    // Export methods
    toJSON(): components['schemas']['DataDictionaryResponse'] {
        return this.response
    }

    getCodebook() {
        return this.codebook
    }

    getMetadata() {
        return {
            title: this.title,
            description: this.description,
            creationDate: this.creationDate,
            language: this.language,
            version: this.codebook.version,
            publisher: this.codebook.publisher,
            contact: this.codebook.contact,
        }
    }

    // Summary method
    getSummary() {
        return {
            title: this.title,
            description: this.description,
            totalVariables: this.getVariables().length,
            totalValueDomains: this.getValueDomains().length,
            totalCategories: this.getCategories().length,
            qualityMetrics: this.qualityMetrics,
            variablesByType: {
                string: this.getVariablesByType('string').length,
                numeric: this.getVariablesByType('numeric').length,
                date: this.getVariablesByType('date').length,
                boolean: this.getVariablesByType('boolean').length,
                text: this.getVariablesByType('text').length,
            },
            variablesByScale: {
                nominal: this.getVariablesByScaleLevel('nominal').length,
                ordinal: this.getVariablesByScaleLevel('ordinal').length,
                interval: this.getVariablesByScaleLevel('interval').length,
                ratio: this.getVariablesByScaleLevel('ratio').length,
            },
        }
    }
}
```

### 4. Starter Helper Function

**File**: `src/starters.ts` (add to existing file)

```typescript
// Add to existing imports
import { DataDictionaryResult } from './results/DataDictionaryResult'

// Add interface
interface GenerateDataDictionaryOptions {
    client?: CoreClient
    title?: string
    description?: string
    context?: string
    language?: string
}

// Add function
export async function generateDataDictionary(
    data: string[][],
    options: GenerateDataDictionaryOptions = {},
): Promise<DataDictionaryResult> {
    const client = options.client ?? new CoreClient()

    const response = await client.generateDataDictionary(data, {
        title: options.title,
        description: options.description,
        context: options.context,
        language: options.language,
        fast: false,
    })

    return new DataDictionaryResult(response)
}
```

## Data Models

### Type Generation

All DDI-related types will be automatically generated from the OpenAPI specification using the
existing type generation process:

```bash
bun run generate
```

This will generate TypeScript interfaces for:

- `DataDictionaryRequest`
- `DataDictionaryResponse`
- `DDIVariable`
- `DDIValueDomain`
- `DDICategory`
- `DDIQuestionItem`
- `DDIUniverse`
- `DDIConcept`
- `DDIMissingValues`
- `DDIVariableGroup`

These types will be available in `src/models.ts` as part of the `components['schemas']` namespace.

### Input Validation

The API enforces the following constraints:

- Maximum 50,000 rows
- Maximum 1,000 columns
- Maximum 100,000 total cells
- All cells must be strings
- Fast mode (fast=true) is not supported

Validation will be handled at two levels:

1. **Client-side**: Explicit check for fast=true and throw error
2. **Server-side**: API validates data limits and returns 400 error if exceeded

## Error Handling

### Error Types

1. **Fast Mode Error**: Thrown when user attempts to use fast=true

    ```typescript
    throw new Error(
        'Data dictionary generation only supports asynchronous mode (fast=false or omitted)',
    )
    ```

2. **Validation Errors**: API returns 400 with `PulseAPIError`
    - Data limits exceeded
    - Invalid data format
    - Missing required fields

3. **Network Errors**: Handled by existing `NetworkError` class

4. **Timeout Errors**: Handled by existing `TimeoutError` class

### Error Handling Pattern

```typescript
try {
    const result = await client.generateDataDictionary(data, options)
} catch (error) {
    if (error instanceof PulseAPIError) {
        // Handle API validation errors
        console.error('API Error:', error.message, error.errors)
    } else if (error instanceof NetworkError) {
        // Handle network errors
        console.error('Network Error:', error.message)
    } else {
        // Handle other errors
        console.error('Unexpected Error:', error)
    }
}
```

## Testing Strategy

### Unit Tests

**File**: `src/core/clients/__tests__/generateDataDictionary.test.ts`

Test cases:

1. Successful data dictionary generation with minimal data
2. Data dictionary generation with all optional metadata
3. Error when fast=true is specified
4. Proper payload construction with options
5. Job polling integration

**File**: `test/processes/generateDataDictionary.test.ts`

Test cases:

1. Process instantiation with required and optional parameters
2. Process execution in context
3. Result type verification

**File**: `test/results/dataDictionaryResult.test.ts`

Test cases:

1. All getter methods return correct data
2. Filter methods work correctly
3. Export methods produce correct output
4. Summary method aggregates data correctly

### Integration Tests

**File**: `test/data-dictionary.integration.test.ts`

Test cases:

1. End-to-end data dictionary generation with real API (using Polly.js recordings)
2. Starter helper function with various input formats
3. Process class in Analyzer pipeline
4. Job monitoring with callbacks
5. Error scenarios (data limits, validation errors)

### Test Data

Create sample 2D arrays for testing:

- Small dataset (5 rows × 4 columns)
- Medium dataset (100 rows × 10 columns)
- Dataset with missing values
- Dataset with numeric and categorical data
- Dataset with invalid data (for error testing)

### Polly.js Recordings

Record API interactions for deterministic testing:

- `generateDataDictionary-basic_<hash>/recording.har`
- `generateDataDictionary-with-options_<hash>/recording.har`
- `generateDataDictionary-error-fast-mode_<hash>/recording.har`
- `generateDataDictionary-job-polling_<hash>/recording.har`

### 5. DSL Integration

**File**: `src/dsl.ts` (add method to Workflow class)

The Workflow class should support data dictionary generation through a fluent API method:

```typescript
// Add method to Workflow class
generateDataDictionary(
    inputAlias: string,
    options: {
        name?: string
        title?: string
        description?: string
        context?: string
        language?: string
    } = {},
): this {
    const data = this.datasets[inputAlias]
    if (!data) {
        throw new Error(`Dataset '${inputAlias}' not found`)
    }
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
        throw new Error(`Dataset '${inputAlias}' must be a 2D array for data dictionary generation`)
    }

    const proc = new GenerateDataDictionary({
        name: options.name,
        data: data as string[][],
        title: options.title,
        description: options.description,
        context: options.context,
        language: options.language,
    }) as DSLProcess

    proc._inputs = [inputAlias]
    this.addProcess(proc, options.name)
    return this
}
```

**Usage Example**:

```typescript
const workflow = new Workflow()
    .source('surveyData', [
        ['Name', 'Age', 'City', 'Satisfaction'],
        ['John Doe', '25', 'New York', 'Very Satisfied'],
        ['Jane Smith', '30', 'Los Angeles', 'Satisfied'],
    ])
    .generateDataDictionary('surveyData', {
        name: 'codebook',
        title: 'Customer Survey',
        description: 'Customer satisfaction survey responses',
    })

const results = await workflow.run()
const codebook = results.codebook // DataDictionaryResult
```

### 6. Analyzer Integration

The Analyzer class already supports generic processes, so no code changes are needed. However, we
should document the usage pattern:

**Usage Example**:

```typescript
import { Analyzer, GenerateDataDictionary, CoreClient } from '@rwai/pulse'

const surveyData = [
    ['Name', 'Age', 'City', 'Satisfaction'],
    ['John Doe', '25', 'New York', 'Very Satisfied'],
    ['Jane Smith', '30', 'Los Angeles', 'Satisfied'],
]

const analyzer = new Analyzer({
    datasets: { surveyData },
    processes: [
        new GenerateDataDictionary({
            data: surveyData,
            title: 'Customer Survey',
            description: 'Customer satisfaction survey responses',
        }),
    ],
    client: new CoreClient(),
    fast: false, // Data dictionary always uses async mode
})

const results = await analyzer.run()
const codebook = results.generateDataDictionary // DataDictionaryResult
```

**Note**: Unlike other processes that operate on string arrays, `GenerateDataDictionary` requires
the data to be passed directly in the constructor since it needs a 2D array structure. The process
doesn't read from the datasets map in the same way as text-based processes.

### 7. Combined Workflow Example

Data dictionary generation can be combined with other processes in a workflow:

```typescript
const workflow = new Workflow()
    .source('surveyData', [
        ['Name', 'Age', 'City', 'Satisfaction'],
        ['John Doe', '25', 'New York', 'Very Satisfied'],
        ['Jane Smith', '30', 'Los Angeles', 'Satisfied'],
    ])
    .source('comments', ['Great service!', 'Could be better', 'Very satisfied with the product'])
    .generateDataDictionary('surveyData', {
        name: 'codebook',
        title: 'Customer Survey',
    })
    .sentiment('comments', { name: 'commentSentiment' })

const results = await workflow.run()
const codebook = results.codebook // DataDictionaryResult
const sentiment = results.commentSentiment // SentimentResult
```

## Integration Points

### 1. Export Updates

**File**: `src/index.ts`

```typescript
// Add to existing exports
export { DataDictionaryResult } from './results/DataDictionaryResult'
export { GenerateDataDictionary } from './processes/GenerateDataDictionary'
```

**File**: `src/results/index.ts`

```typescript
// Add to existing exports
export { DataDictionaryResult } from './DataDictionaryResult'
```

**File**: `src/processes/index.ts`

```typescript
// Add to existing exports
export { GenerateDataDictionary } from './GenerateDataDictionary'
```

### 2. Job Type Updates

The existing `Job` class already supports generic response types, so no changes are needed. The job
polling will automatically work with `DataDictionaryResponse`:

```typescript
const job = await client.generateDataDictionary(data, { awaitJobResult: false })
const result = await job.wait() // Returns DataDictionaryResponse
```

### 3. Documentation Updates

Update the following documentation:

- README.md - Add data dictionary example
- API documentation (TypeDoc) - Auto-generated from JSDoc comments
- docs/starters.md - Add generateDataDictionary helper documentation

## Performance Considerations

### Asynchronous-Only Processing

Unlike other endpoints, data dictionary generation only supports asynchronous processing:

- Always returns job_id (HTTP 202)
- Requires job polling to retrieve results
- No synchronous fast mode available

This design decision is due to:

- Computational complexity of AI-assisted analysis
- Potential for large datasets (up to 100,000 cells)
- Need for structured output generation

### Memory Management

For large datasets:

- Client-side validation before sending request
- Streaming not supported (entire dataset sent in single request)
- Result caching handled by user application

### Rate Limiting

Follow existing rate limiting patterns:

- Respect API rate limits
- Use exponential backoff for job polling
- Leverage existing retry logic in `fetchWithRetry`

## Security Considerations

### Data Privacy

- Data is sent to API for AI analysis
- Users should be aware of data privacy implications
- No client-side data sanitization (user responsibility)

### Input Validation

- Validate data structure before sending
- Ensure all cells are strings
- Check array dimensions against limits

### Error Messages

- Don't expose sensitive data in error messages
- Sanitize error responses from API
- Log errors appropriately without leaking data

## Migration and Compatibility

### Backward Compatibility

This is a new feature, so no breaking changes to existing functionality.

### Version Requirements

- Requires API version 0.10.0 or higher
- No changes to existing client methods
- New types added to `components['schemas']`

### Deprecation

No deprecations required.

## Future Enhancements

Potential future improvements:

1. **Batch Processing**: Support for multiple datasets in single request
2. **Incremental Updates**: Update existing codebooks with new data
3. **Export Formats**: Export DDI Codebook to XML, CSV, or other formats
4. **Validation**: Client-side DDI schema validation
5. **Visualization**: Helper methods for generating codebook visualizations
6. **Comparison**: Compare two codebooks for differences
7. **Merge**: Merge multiple codebooks into one

These enhancements would be implemented as separate features in future iterations.
