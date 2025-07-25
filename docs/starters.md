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
