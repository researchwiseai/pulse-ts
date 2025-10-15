# Starter Helpers

The starter helpers provide convenient wrappers around the common workflows offered by this package.
They handle the creation of an `Analyzer` instance and accept either lists of strings or file paths
(`.txt`, `.csv`, `.tsv`, `.xls`, `.xlsx`). Each helper returns the same result objects as the full
analysis layer so you can immediately work with the structured output.

The helpers mirror the functions exported from `@rwai/pulse`:

```ts
import { sentimentAnalysis, themeAllocation, clusterAnalysis, summarize } from '@rwai/pulse'

const sentiments = await sentimentAnalysis(['text1', 'text2'])
const allocation = await themeAllocation(['text1', 'text2'], ['theme1', 'theme2'])
const clusters = await clusterAnalysis(['text1', 'text2'])
const summary = await summarize(['text1', 'text2'], 'What is the gist?')
```

These wrappers are a quick way to get started without constructing a full workflow. They are also
useful for scripting and exploratory analysis where you want sensible defaults.

## Summarize

The `summarize` helper generates a short answer or overview for a set of texts using a question
prompt. It accepts the same input formats as the other helpers and returns a `SummariesResponse`
object:

```ts
const reviewSummary = await summarize(
    ['loved it', 'could be better'],
    'What do customers think overall?',
)
console.log(reviewSummary.summary)

// control the length or style of the summary
await summarize('reviews.csv', 'Key takeaways?', {
    length: 'short',
    preset: 'one-pager',
})
```

## Generate Data Dictionary

The `generateDataDictionary` helper analyzes tabular data and produces comprehensive DDI (Data
Documentation Initiative) Codebook documentation. Unlike other helpers, it requires a 2D array of
strings as input (typically with column headers in the first row) and returns a
`DataDictionaryResult` object with convenient accessor methods.

**Note**: Data dictionary generation only supports asynchronous mode due to the computational
complexity of analyzing large datasets. The helper automatically handles job polling.

### Basic Usage

```ts
import { generateDataDictionary } from '@rwai/pulse'

const surveyData = [
    ['Name', 'Age', 'City', 'Satisfaction'],
    ['John Doe', '25', 'New York', 'Very Satisfied'],
    ['Jane Smith', '30', 'Los Angeles', 'Satisfied'],
    ['Bob Wilson', '35', 'Chicago', 'Neutral'],
]

const result = await generateDataDictionary(surveyData)

// Access all variables
const variables = result.getVariables()
console.log(`Found ${variables.length} variables`)

// Get a specific variable
const ageVariable = result.getVariableByName('Age')
console.log(ageVariable.type) // 'numeric'
console.log(ageVariable.scaleLevel) // 'ratio'

// Get summary statistics
const summary = result.getSummary()
console.log(summary.totalVariables)
console.log(summary.variablesByType)
console.log(summary.variablesByScale)
```

### With Optional Metadata

You can provide additional metadata to help guide the AI analysis and enrich the generated
documentation:

```ts
const result = await generateDataDictionary(surveyData, {
    title: 'Customer Satisfaction Survey 2024',
    description: 'Annual customer satisfaction survey responses from retail customers',
    context: 'Survey conducted in Q1 2024 across three major cities',
    language: 'en',
})

// Access metadata
const metadata = result.getMetadata()
console.log(metadata.title)
console.log(metadata.description)
console.log(metadata.creationDate)
```

### Working with Variables

The result object provides several methods for filtering and accessing variables:

```ts
// Filter by data type
const numericVars = result.getVariablesByType('numeric')
const stringVars = result.getVariablesByType('string')

// Filter by scale level (measurement level)
const nominalVars = result.getVariablesByScaleLevel('nominal')
const ordinalVars = result.getVariablesByScaleLevel('ordinal')
const intervalVars = result.getVariablesByScaleLevel('interval')
const ratioVars = result.getVariablesByScaleLevel('ratio')

// Filter by group
const demographicVars = result.getVariablesByGroup('demographics')
```

### Working with Value Domains and Categories

For categorical variables, you can access value domains and their categories:

```ts
// Get all value domains
const valueDomains = result.getValueDomains()

// Get a specific value domain
const satisfactionDomain = result.getValueDomainById('satisfaction_vd')

// Get categories for a value domain (sorted by order)
const categories = result.getCategoriesForDomain('satisfaction_vd')
categories.forEach(cat => {
    console.log(`${cat.code}: ${cat.label}`)
})

// Get a specific category by code
const verySatisfied = result.getCategoryByCode('satisfaction_vd', 'VS')
console.log(verySatisfied.label) // 'Very Satisfied'
```

### Accessing DDI Components

The result provides access to all DDI Codebook components:

```ts
// Question items
const questions = result.getQuestionItems()
const question = result.getQuestionById('q1')

// Universes (population definitions)
const universes = result.getUniverses()
const universe = result.getUniverseById('u1')

// Concepts
const concepts = result.getConcepts()
const concept = result.getConceptById('c1')

// Missing values definitions
const missingValues = result.getMissingValues()
const mv = result.getMissingValuesById('mv1')

// Variable groups
const groups = result.getVariableGroups()
const group = result.getVariableGroupById('demographics')
```

### Exporting Data

You can export the codebook in various formats:

```ts
// Get the complete codebook
const codebook = result.getCodebook()

// Get just the metadata
const metadata = result.getMetadata()

// Convert to JSON
const json = result.toJSON()

// Get a summary with statistics
const summary = result.getSummary()
console.log(JSON.stringify(summary, null, 2))
```

### Using a Custom Client

If you need to use a custom `CoreClient` instance (e.g., with specific authentication or
configuration), you can pass it as an option:

```ts
import { CoreClient, ClientCredentialsAuth } from '@rwai/pulse'

const auth = new ClientCredentialsAuth(
    process.env.PULSE_CLIENT_ID!,
    process.env.PULSE_CLIENT_SECRET!,
)

const client = new CoreClient({
    baseUrl: 'https://api.rwai.com/pulse',
    auth,
})

const result = await generateDataDictionary(surveyData, {
    client,
    title: 'My Survey',
})
```

### Data Limits

The API enforces the following limits for data dictionary generation:

- Maximum 50,000 rows
- Maximum 1,000 columns
- Maximum 100,000 total cells

If your data exceeds these limits, you'll receive a validation error. Consider sampling or splitting
your data into smaller chunks.

### Return Type

The `generateDataDictionary` helper returns a `DataDictionaryResult` object with the following key
methods:

**Variable Methods:**

- `getVariables()` - Get all variables
- `getVariableByName(name)` - Find a variable by name
- `getVariablesByType(type)` - Filter by data type
- `getVariablesByScaleLevel(scaleLevel)` - Filter by measurement level
- `getVariablesByGroup(groupRef)` - Filter by group

**Value Domain Methods:**

- `getValueDomains()` - Get all value domains
- `getValueDomainById(id)` - Find a value domain by ID
- `getValueDomainsByType(domainType)` - Filter by domain type

**Category Methods:**

- `getCategories()` - Get all categories
- `getCategoriesForDomain(valueDomainId)` - Get categories for a specific value domain
- `getCategoryByCode(valueDomainId, code)` - Find a category by code

**DDI Component Methods:**

- `getQuestionItems()`, `getQuestionById(id)`
- `getUniverses()`, `getUniverseById(id)`
- `getConcepts()`, `getConceptById(id)`
- `getMissingValues()`, `getMissingValuesById(id)`
- `getVariableGroups()`, `getVariableGroupById(id)`, `getVariableGroupsByType(groupType)`

**Export Methods:**

- `toJSON()` - Convert to plain JSON
- `getCodebook()` - Get the complete DDI Codebook
- `getMetadata()` - Get metadata only
- `getSummary()` - Get summary with statistics
