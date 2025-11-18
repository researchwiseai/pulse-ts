---
title: Analyzer & Jobs
description: Orchestrate Pulse processes programmatically and monitor asynchronous jobs.
---

The `Analyzer` class executes a deterministic list of Pulse processes without the DSL sugar. It is the best fit when you already know which steps should run and want maximum control over the datasets map.

## Basic usage

```ts
import { Analyzer, Processes, CoreClient } from '@rwai/pulse'

const processes = [
    new Processes.Sentiment({ fast: true }),
    new Processes.Cluster(),
    new Processes.GenerateSummary({ question: 'What matters most?' }),
] as const

const analyzer = new Analyzer({
    datasets: { dataset: ['Happy agent', 'Need faster answers'] },
    processes,
    client: new CoreClient({ auth }),
    fast: true,
})

const results = await analyzer.run()
console.log(results.sentiment.summary())
```

The analyzer resolves dependencies automatically. If any process declares `dependsOn = ['themeGeneration']`, the corresponding process is inserted for you.

## Supplying datasets

Each process reads from the alias declared in its `_inputs` metadata. When using the DSL, this metadata is set automatically. When constructing processes manually, pass the `inputs`/`source` options so the analyzer can populate `_inputs`.

```ts
const themeAllocation = new Processes.ThemeAllocation({ themes: ['CX', 'Logistics'] })
;(themeAllocation as any)._inputs = ['dataset']
```

In practice you rarely set `_inputs` yourself—prefer the DSL when you need dynamic wiring. You can still hand the analyzer the same processes array that the DSL built via `workflow['processes']` if you want to persist a compiled pipeline.

## CoreClient highlights

`CoreClient` is the low-level HTTP surface that the Analyzer uses internally. It focuses on reliability features:

- Removes trailing slashes from `baseUrl` to avoid double slashes.
- Accepts any `Auth` implementation and forwards `fast`/`awaitJobResult` flags to process helpers.
- Adds the `x-pulse-debug` header when `debug: true`, which enables server-side trace ids.

Every method follows the same shape:

```ts
const job = await client.clusterTexts(inputs, { fast: false, awaitJobResult: false })
const result = await job.result()
```

Pass `awaitJobResult: true` to have helpers poll the job automatically before returning.

## Handling jobs manually

Long-running processes such as clustering or data dictionaries can return a `JobInfo` instead of the final payload. Use the exported `Job` helper to poll until completion:

```ts
const job = await client.generateDataDictionary(data, { awaitJobResult: false })
const result = await job.result()

// Need to slow down polling? reconstruct with custom settings
import { Job } from '@rwai/pulse'

const slowPolling = new Job({
    jobId: job.jobId,
    baseUrl: client.baseUrl,
    auth: client.auth,
    debug: true,
    pollIntervalMs: 5000,
})
const sameResult = await slowPolling.result()
```

You can also query job status via `client.requestFeature('jobs', { id })` if you need a lighter abstraction.

## Mixing Analyzer and DSL

Workflows expose their compiled process list, so you can still capture advanced wiring in the DSL and then execute it inside an Analyzer to plug into your own lifecycle hooks:

```ts
import { Workflow, Analyzer } from '@rwai/pulse'

const wf = new Workflow()
    .source('dataset', feedback)
    .sentiment({ name: 'sentiment' })
    .cluster({ name: 'clusters' })

const analyzer = new Analyzer({
    datasets: wf['datasets'],
    processes: wf['processes'],
    client,
})
```

This is useful when you want the DSL ergonomics for authoring but need a test harness that directly controls Analyzer lifecycles.
