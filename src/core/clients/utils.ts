/**
 * Normalize a job identifier returned by the API, accepting either `job_id` (snake_case)
 * or `jobId` (camelCase), and returning the unified camelCase `jobId`.
 *
 * @param json - The raw JSON object containing one of `job_id` or `jobId`.
 */
export function normalizeJobId(json: { job_id: string } | { jobId: string }): string {
    return 'job_id' in json ? json.job_id : json.jobId
}
