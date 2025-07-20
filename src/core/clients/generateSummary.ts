import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'
import type { Job } from '../job'
import { requestFeature } from './requestFeature'
import type { components } from '../../models'

export interface GenerateSummaryOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
> extends UniversalFeatureOptions<Fast, AwaitJobResult> {
    length?: components['schemas']['SummariesRequest']['length']
    preset?: components['schemas']['SummariesRequest']['preset']
}

export async function generateSummary<
    Fast extends boolean | undefined = undefined,
    AwaitJobResult extends boolean | undefined = undefined,
>(
    client: CoreClient,
    inputs: string[],
    question: string,
    options: GenerateSummaryOptions<Fast, AwaitJobResult> = {},
): Promise<
    AwaitJobResult extends false
        ? Job<components['schemas']['SummariesResponse']>
        : components['schemas']['SummariesResponse']
> {
    return requestFeature(
        client,
        '/summaries',
        {
            inputs,
            question,
            length: options.length,
            preset: options.preset,
        },
        options,
    )
}
