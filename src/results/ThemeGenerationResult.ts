import type { ThemesResponse, Theme } from '../models'

/**
 * Results of theme generation with helper methods.
 */

export class ThemeGenerationResult {
    constructor(private response: ThemesResponse) {}

    /** Generated themes metadata. */
    get themes(): Theme[] {
        return this.response.themes
    }

    /** Convert theme metadata to a plain array of objects. */
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
