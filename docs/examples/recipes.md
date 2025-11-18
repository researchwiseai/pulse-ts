---
title: Practical Recipes
description: Opinionated workflow snippets you can copy into jobs, notebooks, or feature flags.
---

## 1. Daily pulse digest

Summarize all tickets created today, allocate themes, and email a digest.

```ts
import { Workflow } from '@rwai/pulse'

const tickets = await fetchZendeskTickets()
const wf = new Workflow()
    .source('tickets', tickets.map(t => `${t.subject}\n${t.description}`))
    .sentiment({ source: 'tickets', name: 'sentiment' })
    .themeGeneration({ source: 'tickets', name: 'themes' })
    .themeAllocation({ inputs: 'tickets', themesFrom: 'themes', name: 'allocation' })
    .generateSummary({
        source: 'tickets',
        question: 'What should support leads know for stand-up?',
        preset: 'one-pager',
        name: 'digest',
    })

const { sentiment, themes, allocation, digest } = await wf.run({ client })
await sendEmail({
    to: 'support@company.com',
    subject: 'Daily sentiment digest',
    body: renderDigest({ sentiment, themes, allocation, digest }),
})
```

## 2. Comparing cohorts

Use two sources and the similarity helper to quantify how two customer cohorts diverge.

```ts
import { Workflow } from '@rwai/pulse'

const wf = new Workflow()
    .source('pro', proCustomerFeedback)
    .source('starter', starterCustomerFeedback)
    .compareSimilarity({ name: 'cohortSimilarity', source: 'pro' })
    .generateSummary({
        source: 'pro',
        question: 'How do professional users feel?',
        name: 'proSummary',
    })
    .generateSummary({
        source: 'starter',
        question: 'What frustrates starter tier users?',
        name: 'starterSummary',
    })
```

Downstream you can examine `results.cohortSimilarity.matrix` to detect drift.

## 3. Augment a dashboard with data dictionaries

Embed data dictionary metadata as JSON next to your BI extracts.

```ts
import { Workflow } from '@rwai/pulse'

const salesRows = await exportSheet('sales.csv')
const wf = new Workflow()
    .source('sales', salesRows)
    .generateDataDictionary('sales', {
        name: 'salesDictionary',
        title: 'Sales QA Extract',
        description: 'Used by Looker tiles',
    })

const { salesDictionary } = await wf.run({ client })
await writeFile('dist/sales-ddi.json', JSON.stringify(salesDictionary.toJSON(), null, 2))
```

## 4. Alert when clusters mention a risky theme

Combine starter helpers with your own heuristics.

```ts
import { summarize, clusterAnalysis } from '@rwai/pulse'

const { summary: riskSummary } = await summarize(comments, 'Summarize only risky items', {
    fast: false,
})

const clusters = await clusterAnalysis(comments)
if (clusters.topics().some(topic => /outage|security/i.test(topic.label))) {
    await createIncident({
        title: 'Customers reporting outages',
        payload: { clusters, riskSummary },
    })
}
```

## 5. Batch process CSV uploads

When analysts upload CSV files, push them through a standard workflow and store the monitor output for auditability.

```ts
import { Workflow } from '@rwai/pulse'

const wf = new Workflow()
    .source('dataset', rows)
    .sentiment()
    .cluster()
    .monitor({
        onProcessStart: id => auditLog.append({ id, event: 'start', timestamp: Date.now() }),
        onProcessEnd: (id, res) => auditLog.append({ id, event: 'end', result: res }),
    })

await wf.run({ client })
```

Keep contributing your own snippets via pull requests—the Recipes page is intentionally short so teams can slot in opinionated practices.
