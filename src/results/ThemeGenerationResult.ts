import type { ThemesResponse, Theme } from '../models'

/**
 * Results of theme generation with helper methods.
 */

/**
 * Results of theme generation with helper methods.
 */
export class ThemeGenerationResult {
    /**
     * @param response - The raw themes response from the API.
     */
    constructor(private response: ThemesResponse) {}

    /** Array of generated Theme objects. */
    get themes(): Theme[] {
        return this.response.themes
    }

    /**
     * Convert theme metadata to a plain array of objects for easier consumption.
     *
     * @returns Array of objects with theme labels, description, and representatives.
     */
    toArray(): Array<{
        shortLabel: string
        label: string
        description: string
        representative_1: string
        representative_2?: string
    }> {
        return this.response.themes.map(theme => ({
            shortLabel: theme.shortLabel,
            label: theme.label,
            description: theme.description,
            representative_1: theme.representatives[0] ?? '',
            representative_2: theme.representatives[1],
        }))
    }
}
