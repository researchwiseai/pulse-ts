import type { CoreClient } from '../core/clients/CoreClient'

/**
 * Represents the base context for processing workflows.
 *
 * @remarks
 * Bundles shared resources and state used across multiple processing steps.
 *
 * @property client  The CoreClient instance for handling external interactions.
 * @property fast    When true, enables fast processing mode, potentially skipping non-critical steps.
 * @property datasets A record mapping source/process identifiers to their data or result values.
 */
export interface ContextBase {
    client: CoreClient

    fast: boolean

    datasets: Record<string, unknown>

    processes: readonly Process<string, unknown>[]
}

/**
 * Represents a generic process with a unique identifier, name, dependencies, and a run method.
 *
 * @typeParam Name - The type of the process name, constrained to string.
 * @typeParam Return - The return type of the run method. Defaults to unknown.
 * @typeParam Ctx - The context type passed to the run method. Defaults to ContextBase.
 *
 * @property id - A unique identifier for the process.
 * @property name - The name of the process.
 * @property dependsOn - An array of process IDs that this process depends on.
 * @property run - A function that executes the process logic, accepting a context and returning a value or a promise of a value.
 */
export interface Process<
    Name extends string,
    Return = unknown,
    Ctx extends ContextBase = ContextBase,
> {
    id: string
    name: Name
    dependsOn: string[]
    run(ctx: Ctx): Promise<Return> | Return
}

/**
 * Represents a static type for a process class.
 *
 * @template Name - The type of the process name, constrained to string.
 * @template Return - The return type of the process, defaults to unknown.
 *
 * @property id - A unique identifier for the process class.
 * @constructor Creates a new instance of the process with optional configuration.
 * @param options - Optional configuration object containing the process name.
 * @returns An instance of the Process with the specified name and return type.
 */
export interface ProcessStatic<Name extends string, Return = unknown> {
    new (options?: { name?: Name }): Process<Name, Return>
    readonly id: string
}

/**
 * Transforms a tuple of `Process` types into an object type mapping each process's `name`
 * to the awaited return type of its `run` method.
 *
 * @template T - A readonly tuple of `Process` types.
 * @remarks
 * Each property key in the resulting type corresponds to the `name` property of a `Process` in the tuple,
 * and its value is the resolved return type of that process's `run` method.
 */
export type TupleToResult<T extends readonly Process<string, unknown>[]> = {
    [P in T[number] as P['name']]: Awaited<ReturnType<P['run']>>
}

/**
 * A TypeScript decorator factory to enforce that a class statically implements a given interface.
 *
 * This utility is used to provide compile-time checking that a class conforms to a static interface,
 * even though TypeScript does not natively support static interface implementation.
 *
 * @template T The static interface to be implemented by the class.
 * @returns A class decorator that enforces the static interface implementation.
 *
 * @example
 * interface MyStatic {
 *   new (): any;
 *   staticMethod(): void;
 * }
 *
 * @staticImplements<MyStatic>()
 * class MyClass {
 *   static staticMethod() { ... }
 * }
 */
export function staticImplements<T>() {
    return <U extends T>(constructor: U) => {
        return constructor
    }
}

/**
 * Creates a mutable version of a readonly tuple type.
 *
 * @typeParam T - The readonly tuple type to be made mutable.
 * @example
 * ```typescript
 * type ReadonlyTuple = readonly [number, string];
 * type Mutable = MutableTuple<ReadonlyTuple>; // [number, string]
 * ```
 */
export type MutableTuple<T extends readonly unknown[]> = { -readonly [K in keyof T]: T[K] }

/**
 * Creates a tuple of `Process` items with preserved types.
 *
 * Helper designed for use in Analyzer or DSL to ensure type safety
 *
 * @typeParam P - A readonly tuple of `Process` instances with string identifiers and unknown payloads.
 * @param items - The `Process` instances to include in the tuple.
 * @returns The input `Process` instances as a tuple with their types preserved.
 */
export const processes = <P extends readonly Process<string, unknown>[]>(...items: P): P => items
