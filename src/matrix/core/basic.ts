import { z } from 'zod/mini'

// export type SupportedType<T> = T extends [] ? T | Array<T> : Array<T>[];

// /**
//  * Represents a value of type T or an array of such values nested to any depth.
//  *
//  * This recursive type allows for arbitrarily nested arrays containing elements
//  * of type T, enabling structures like T[], T[][], T[][][], etc.
//  *
//  * @typeParam T - The element type contained within the nested array structure.
//  */
// export type NestedArray<T, S extends SupportedType<T> = SupportedType<T>> =
//     | S
//     | NestedArray<S>[];

/**
 * Represents a value of type T or an array of such values nested to any depth.
 *
 * This recursive type allows for arbitrarily nested arrays containing elements
 * of type T, enabling structures like T, T[], T[][], T[][][], etc.
 *
 * @typeParam T - The element type contained within the nested array structure.
 */
export type NestedArray<T> = T | NestedArray<T>[]

/**
 * A branded integer type that distinguishes qualified integer values from plain numbers.
 *
 * This type alias augments the primitive `number` with a `unique symbol` brand
 * to enforce compile-time type safety. It ensures that only values explicitly
 * created or asserted as `QInt` can be used where a qualified integer is required,
 * preventing accidental mixing with unbranded numeric values.
 *
 * @remarks
 * Use factory functions or explicit type assertions to create `QInt` instances.
 * The branding is erased at runtime, so `QInt` values behave like regular numbers
 * during execution but remain distinct at compile time.
 *
 * @public
 */
export type QInt = number & { readonly __QInt: unique symbol }

/**
 * Zod schema for a "qualified" integer (QInt).
 *
 * Validates that the input is:
 *  - an integer
 *  - between -100 and 100 (inclusive)
 *
 * Upon successful validation, the value is narrowed to the `QInt` type.
 */
export const QInt = z.pipe(
    z.int().check(z.gte(-127)).check(z.lte(127)),
    z.transform((n: number) => n as QInt),
)

/**
 * Converts a JavaScript number into a QInt instance.
 *
 * @param n - The numeric value to be interpreted as a QInt.
 * @returns A new QInt object representing the provided number.
 * @throws {Error} If the number is outside the valid range or cannot be parsed into a QInt.
 */
export const asQInt = (n: number): QInt => QInt.parse(n)
/**
 * A branded unsigned integer type that distinguishes qualified unsigned 8-bit integer values from plain numbers.
 *
 * This type alias augments the primitive `number` with a `unique symbol` brand
 * to enforce compile-time type safety for unsigned 8-bit quantization values.
 * It represents values in the range [0, 255].
 *
 * @public
 */
export type UQInt = number & { readonly __UQInt: unique symbol }
/**
 * Zod schema for an unsigned "qualified" 8-bit integer (UQInt).
 *
 * Validates that the input is:
 *  - an integer
 *  - between 0 and 255 (inclusive)
 *
 * Upon successful validation, the value is narrowed to the `UQInt` type.
 */
export const UQInt = z.pipe(
    z.int().check(z.gte(0)).check(z.lte(255)),
    z.transform((n: number) => n as UQInt),
)
/**
 * Converts a JavaScript number into a UQInt instance.
 *
 * @param n - The numeric value to be interpreted as a UQInt.
 * @returns A new UQInt object representing the provided number.
 * @throws {Error} If the number is outside the valid range or cannot be parsed into a UQInt.
 */
export const asUQInt = (n: number): UQInt => UQInt.parse(n)

/**
 * Type guard to determine whether a number has been branded as a QInt.
 *
 * @param n - The value to test.
 * @returns True if the value is a branded QInt, false otherwise.
 */
export function isQInt(n: number): n is QInt {
    return (n as QInt)?.__QInt !== undefined
}

/**
 * Type guard to determine whether a number has been branded as a UQInt.
 *
 * @param n - The value to test.
 * @returns True if the value is a branded UQInt, false otherwise.
 */
export function isUQInt(n: number): n is UQInt {
    return (n as UQInt)?.__UQInt !== undefined
}
