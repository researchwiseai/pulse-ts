# Starter Helpers

Pulse includes convenient helper functions for common analysis tasks. These helpers wrap the core client APIs with sensible defaults so you can get started quickly.

```ts
import { sentimentAnalysis, themeAllocation, clusterAnalysis } from '@rwai/pulse'
const sentiments = await sentimentAnalysis(['text1', 'text2'], client)
const allocation = await themeAllocation(['text1', 'text2'], client, ['theme1', 'theme2'])
const clusters = await clusterAnalysis(['text1', 'text2'], client)
```

Each helper accepts the texts to analyze and the client instance. The themeAllocation helper can optionally take a list of themes; when omitted it will generate themes automatically.
