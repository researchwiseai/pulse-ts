# Workflow DSL

Complex analysis pipelines can be composed using the `Workflow` class.

```ts
import { Workflow } from '@rwai/pulse'

const workflow = new Workflow()
  .source('dataset', ['hello', 'world'])
  .theme_generation({ minThemes: 2, maxThemes: 5 })
  .sentiment()
  .cluster()

const results = await workflow.run(undefined, { client })
console.log(results.theme_generation.themes)
```
