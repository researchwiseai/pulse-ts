import { defineConfig } from 'vitepress'
import { cpSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineConfig({
    lang: 'en-US',
    title: 'Pulse TypeScript SDK',
    description: 'Author reliable RWAI Pulse analysis workflows with TypeScript',
    lastUpdated: true,
    cleanUrls: true,
    themeConfig: {
        logo: '/logo.svg',
        siteTitle: 'Pulse TS',
        nav: [
            { text: 'Guide', link: '/getting-started' },
            { text: 'Workflows', link: '/guides/workflows' },
            { text: 'Examples', link: '/examples/recipes' },
            { text: 'Resources', link: '/resources/operations' },
            { text: 'API Reference', link: '/api/index.html' },
        ],
        sidebar: {
            '/guides/': [
                {
                    text: 'Guides',
                    items: [
                        { text: 'Workflow DSL', link: '/guides/workflows' },
                        { text: 'Starters & Helpers', link: '/guides/starters' },
                        { text: 'Authentication', link: '/guides/authentication' },
                        { text: 'Analyzer & Jobs', link: '/guides/analyzer' },
                        { text: 'Data Dictionary', link: '/guides/data-dictionary' },
                    ],
                },
            ],
            '/examples/': [
                {
                    text: 'Examples',
                    items: [{ text: 'Practical Recipes', link: '/examples/recipes' }],
                },
            ],
            '/resources/': [
                {
                    text: 'Resources',
                    items: [
                        { text: 'Operational Playbook', link: '/resources/operations' },
                        { text: 'Troubleshooting Checklist', link: '/resources/troubleshooting' },
                    ],
                },
            ],
            '/': [
                {
                    text: 'Overview',
                    items: [
                        { text: 'Introduction', link: '/' },
                        { text: 'Getting Started', link: '/getting-started' },
                    ],
                },
            ],
        },
        editLink: {
            pattern: 'https://github.com/rwai/pulse-ts/edit/main/docs/:path',
            text: 'Suggest changes to this page',
        },
        socialLinks: [{ icon: 'github', link: 'https://github.com/rwai/pulse-ts' }],
        footer: {
            message: 'Released under the Apache 2.0 License',
            copyright: `© ${new Date().getFullYear()} RWAI, Inc.`,
        },
        search: {
            provider: 'local',
        },
    },
    head: [
        ['meta', { property: 'og:title', content: 'Pulse TypeScript SDK' }],
        [
            'meta',
            {
                property: 'og:description',
                content: 'Typed helper methods, workflow DSL, and Analyzer for the RWAI Pulse platform.',
            },
        ],
    ],
    buildEnd(siteConfig) {
        const apiSrc = resolve(siteConfig.srcDir, 'api')
        const apiDest = resolve(siteConfig.outDir, 'api')
        if (existsSync(apiSrc)) {
            cpSync(apiSrc, apiDest, { recursive: true })
        }
    },
})
