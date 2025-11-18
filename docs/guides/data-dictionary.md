---
title: Data Dictionary Guide
description: Generate DDI Codebooks, inspect variables, and feed structured metadata back into RWAI Pulse.
---

The Data Dictionary helper converts tabular datasets into a DDI Codebook JSON tree. It powers downstream analytics where you need labeled variables, measurement levels, and multilingual metadata.

## Prepare the data

- Provide a 2D array of strings. Each inner array is a row.
- Include a header row so the generator can infer variable names.
- Keep inputs within platform limits (≤ 50k rows, 1k columns, 100k cells).

You can load CSV files with your favorite parser and pass the resulting array:

```ts
import { parse } from 'csv-parse/sync'
import { generateDataDictionary } from '@rwai/pulse'

const csv = fs.readFileSync('survey.csv', 'utf8')
const records = parse(csv, { skip_empty_lines: true })
const dictionary = await generateDataDictionary(records)
```

## Metadata options

`title`, `description`, `context`, and `language` guide the AI summary.

```ts
const res = await generateDataDictionary(records, {
    title: 'Customer Voice 2025',
    description: 'North American NPS study',
    context: 'Panel of 1,200 B2B customers',
    language: 'en',
})
```

All metadata is reflected under `result.metadata`. You can reuse it when rendering reports or syncing with catalogs.

## Explore the result object

The helper returns a `DataDictionaryResult` wrapper with ergonomic helpers:

```ts
const summary = res.getSummary()
console.log(summary.variablesByType.numeric) // => 12

const age = res.getVariableByName('Age')
age?.valueDomain?.categories?.forEach(category => {
    console.log(category.code, category.label)
})

const questions = res.getQuestionItems()
const demographics = res.getVariablesByGroup('Demographics')
```

Reference the [Starter Helpers guide](/guides/starters#generate-data-dictionary) for a full walkthrough of every accessor.

## Integrate with workflows

Workflows can emit codebooks alongside other analyses:

```ts
new Workflow()
    .source('survey', surveyRows)
    .generateDataDictionary('survey', {
        name: 'ddi',
        title: 'Employee Engagement 2025',
    })
    .sentiment({ source: 'survey', name: 'sentiment' })
```

`GenerateDataDictionary` creates an internal process that does not require a dataset alias at runtime because the data is embedded in the process itself. The DSL still enforces input registration so you can control provenance.

## Common review checklist

- ✅ Inspect `res.getVariablesByScaleLevel('ordinal')` to spot mis-labeled Likert items.
- ✅ Use `res.getValueDomainById()` to fetch coded answer scales ready for chart legends.
- ✅ Store the raw JSON to S3 or blob storage; every accessor returns views into this object.
- ✅ Keep metadata short—long titles make the codebook harder to skim.

Pair the generated codebooks with the VitePress Resources section below to keep analysts and engineers aligned on dataset semantics.
