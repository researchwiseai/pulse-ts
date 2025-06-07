import { ThemeGeneration } from './ThemeGeneration';
import type { Process } from './types';

/**
 * Process: extract elements matching themes from input strings.
 */

export class ThemeExtraction implements Process {
    static readonly id = 'theme_extraction';
    id = ThemeExtraction.id;
    dependsOn: string[] = [ThemeGeneration.id];

    themes?: string[];
    version?: string;
    fast?: boolean;

    constructor(options: { themes?: string[]; version?: string; fast?: boolean; } = {}) {
        this.themes = options.themes;
        this.version = options.version;
        this.fast = options.fast;
    }

    run(ctx: any) {
        const texts: string[] = Array.isArray(ctx.dataset) ? ctx.dataset : [];
        let usedThemes: string[];
        if (this.themes != null) {
            usedThemes = [...this.themes];
        } else {
            const alias = (this as any)._themesFromAlias || ThemeGeneration.id;
            const prev = ctx.results[alias];
            if (prev != null && Array.isArray(prev.themes)) {
                usedThemes = prev.themes;
            } else if (ctx.sources?.[alias]) {
                usedThemes = [...ctx.sources[alias]];
            } else {
                throw new Error(`${alias} result not available for extraction`);
            }
            this.themes = usedThemes;
        }
        const fastFlag = this.fast ?? ctx.fast;
        return ctx.client.extract_elements(texts, usedThemes, fastFlag);
    }
}
