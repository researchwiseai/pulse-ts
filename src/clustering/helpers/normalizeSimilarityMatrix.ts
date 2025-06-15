/**
 * Converts a similarity matrix into a distance matrix.
 *
 * This function transforms a matrix where higher values indicate greater similarity
 * into a matrix where lower values indicate less distance (i.e., items are closer).
 * It can handle similarity values in various ranges.
 *
 * If the `skip` parameter is `true`, or if `skip` is `false` and all similarity
 * values are already within the standard `[0, 1]` range, the distance is
 * calculated as `1 - similarity`.
 *
 * If `skip` is `false` and the input matrix contains values outside the `[0, 1]` range
 * (e.g., a cosine similarity matrix with values in `[-1, 1]`), the function
 * applies a normalization formula: `(1 - similarity) / (originalMax - originalMin)`.
 * This scales the inverted similarities to ensure meaningful distance values.
 *
 * @param matrix - The input 2D array of numbers representing the similarity matrix.
 *                 It's assumed that higher values in this matrix signify greater similarity.
 * @param skip - Optional. If set to `true`, the function bypasses the normalization
 *               logic for matrices with values outside `[0, 1]` and directly applies
 *               the `1 - similarity` calculation. Defaults to `false`.
 * @returns A 2D array of numbers representing the distance matrix. Smaller values
 *          indicate less distance between items (corresponding to higher original similarity).
 *
 * @remarks
 * - **Standard Conversion (`[0, 1]` range or `skip = true`):**
 *   Distance = `1 - similarity`.
 *   For example, a similarity of `1` becomes a distance of `0`, and a similarity of `0`
 *   becomes a distance of `1`.
 *
 * - **Normalization (values outside `[0, 1]` and `skip = false`):**
 *   Distance = `(1 - similarity) / (originalMax - originalMin)`.
 *   - `originalMin` and `originalMax` are the minimum and maximum values found in the input matrix.
 *   - This formula effectively maps the input similarity range to a distance range. For instance,
 *     for an input similarity range of `[-1, 1]`, this formula maps it to a distance range of `[0, 1]`.
 *   - If `originalMax` equals `originalMin` (i.e., all similarity values in the matrix are identical),
 *     all resulting distances will be `0` to prevent division by zero and reflect that there are
 *     no differences in similarity.
 */
export function normalizeSimilarityMatrix(matrix: number[][], skip: boolean = false): number[][] {
    // Determine if values fall outside the standard [0, 1] range
    const needsNormalization = matrix.some(row => row.some(val => val < 0 || val > 1))

    // If skipping normalization or all values already in [0,1], use simple inversion
    if (skip || !needsNormalization) {
        return matrix.map(row => row.map(sim => 1 - sim))
    }

    // Compute the min and max values in the entire matrix
    const flat = matrix.flat()
    const originalMin = Math.min(...flat)
    const originalMax = Math.max(...flat)
    const range = originalMax - originalMin

    // If there is no range, all distances are zero
    if (range === 0) {
        return matrix.map(row => row.map(() => 0))
    }

    // Normalize: map highest similarity to 0 distance, lowest to 1
    return matrix.map(row =>
        row.map(sim => {
            return (originalMax - sim) / range
        }),
    )
}
