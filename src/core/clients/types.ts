import type { components } from '../../models'

/**
 * Options controlling synchronous vs asynchronous feature requests.
 *
 * @typeParam Fast - If true, request a fast synchronous response.
 * @typeParam AwaitJobResult - If false when fast=false, return a Job handle.
 */
export interface UniversalFeatureOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
> {
    /** When true, request a fast synchronous API response if available. */
    fast?: Fast
    /** When false and fast is false, return a Job handle instead of awaiting the result. */
    awaitJobResult?: AwaitJobResult
    /** Optional provider override for custom OpenAI configuration. */
    provider?: components['schemas']['ProviderSpec']
}
