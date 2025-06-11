import type { CoreClient } from '../core/clients/CoreClient'

/**
 * Represents the base context for processing workflows.
 *
 * @remarks
 * Bundles shared resources and state used across multiple processing steps.
 *
 * @property client  The CoreClient instance for handling external interactions.
 * @property fast    When true, enables fast processing mode, potentially skipping non-critical steps.
 * @property results A record mapping identifiers to arbitrary result data produced during processing.
 * @property dataset The array of data items that the workflow will operate on.
 */
export interface ContextBase {
    client: CoreClient

    fast: boolean

    results: Record<string, unknown>

    dataset: string[]

    processes: readonly Process<string, unknown>[]
}

/**
 * Protocol for a processing step in Analyzer or DSL.
 */
export interface Process<
    Name extends string,
    Return = unknown,
    Ctx extends ContextBase = ContextBase
> {
    id: string
    name: Name
    dependsOn: string[]
    run(ctx: Ctx): Promise<Return> | Return
}

export interface ProcessStatic<Name extends string, Return = unknown> {
    new (options?: { name?: Name }): Process<Name, Return>
    readonly id: string
}

export type TupleToResult<T extends readonly Process<string, unknown>[]> = {
    [P in T[number] as P['name']]: Awaited<ReturnType<P['run']>>
}

/* class decorator */
export function staticImplements<T>() {
    return <U extends T>(constructor: U) => {
        constructor
    }
}

export type MutableTuple<T extends readonly unknown[]> = { -readonly [K in keyof T]: T[K] }
