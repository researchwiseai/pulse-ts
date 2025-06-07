import type { CoreClient } from '../core/clients/CoreClient';


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
    client: CoreClient;

    fast: boolean;

    results: Record<string, unknown>

    dataset: string[];
}

/**
 * Protocol for a processing step in Analyzer or DSL.
 */
export interface Process<Return = unknown, Ctx extends ContextBase = ContextBase> {
    id: string
    dependsOn: string[]
    run(ctx: Ctx): Promise<Return> | Return
}

