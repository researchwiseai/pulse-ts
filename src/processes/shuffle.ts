/**
 * Randomly shuffles the elements of an array without mutating the original.
 *
 * This function implements the Fisher–Yates (Knuth) shuffle algorithm
 * to produce a new array with the same elements in random order.
 *
 * @typeParam T - The type of elements contained in the array.
 * @param arr - The array to shuffle.
 * @returns A new array containing all input elements in a randomized order.
 */
export function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));[a[i] as unknown, a[j] as unknown] = [a[j], a[i]];
    }
    return a;
}
