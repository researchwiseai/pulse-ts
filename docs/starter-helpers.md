# Starter Helpers

Convenience helpers are provided for common workflows so you can get started quickly.

```ts
import { sentimentAnalysis, themeAllocation, clusterAnalysis } from '@rwai/pulse'

const sentiments = await sentimentAnalysis(['a', 'b'], client)
const allocation = await themeAllocation(['a', 'b'], client)
const clusters = await clusterAnalysis(['a', 'b'], client)
```
