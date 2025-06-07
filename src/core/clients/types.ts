export interface UniversalFeatureOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined
> {
    fast?: Fast
    awaitJobResult?: AwaitJobResult
}
