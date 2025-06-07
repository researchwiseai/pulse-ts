import { shuffle } from './shuffle';
import type { Process } from './types';

/**
 * Process: cluster texts into latent themes.
 */

export class ThemeGeneration implements Process {
    static readonly id = 'theme_generation';
    id = ThemeGeneration.id;
    dependsOn: string[] = [];

    minThemes: number;
    maxThemes: number;
    context: any;
    fast?: boolean;

    constructor(
        options: {
            minThemes?: number;
            maxThemes?: number;
            context?: any;
            fast?: boolean;
        } = {}
    ) {
        this.minThemes = options.minThemes ?? 2;
        this.maxThemes = options.maxThemes ?? 50;
        this.context = options.context;
        this.fast = options.fast;
    }

    async run(ctx: any) {
        let texts: string[] = Array.isArray(ctx.dataset) ? ctx.dataset : [];
        const fastFlag = this.fast ?? ctx.fast;
        const sampleSize = fastFlag ? 200 : 1000;
        if (texts.length > sampleSize) {
            texts = shuffle(texts).slice(0, sampleSize);
        }
        return ctx.client.generate_themes(texts, this.minThemes, this.maxThemes, fastFlag);
    }
}
