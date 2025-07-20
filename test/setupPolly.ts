import path from 'path'
import { fileURLToPath } from 'url'
import { Polly } from '@pollyjs/core'
import NodeHttpAdapter from '@pollyjs/adapter-node-http'
import FetchAdapter from '@pollyjs/adapter-fetch'
import FSPersister from '@pollyjs/persister-fs'
import { beforeEach, afterEach } from 'vitest'

function scrubTokens(obj: unknown): void {
    if (Array.isArray(obj)) {
        obj.forEach(scrubTokens)
        return
    }
    if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                if (/token$/i.test(key) || key === 'authorization') {
                    ;(obj as Record<string, unknown>)[key] = '<redacted>'
                } else {
                    try {
                        const parsed = JSON.parse(value)
                        scrubTokens(parsed)
                        ;(obj as Record<string, unknown>)[key] = JSON.stringify(parsed)
                    } catch {
                        // ignore
                    }
                }
            } else {
                scrubTokens(value)
            }
        }
    }
}

// Register Polly adapters and persisters
Polly.register(NodeHttpAdapter)
Polly.register(FetchAdapter)
Polly.register(FSPersister)

// Determine recordings directory in package test folder
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const recordingsDir = path.resolve(__dirname, 'recordings')

/**
 * Sets up Polly recording and persisting for tests.
 * @param options Additional Polly configuration to override defaults.
 */
export function setupPolly(options?: Record<string, unknown>) {
    let polly: Polly

    beforeEach(context => {
        polly = new Polly(context.task.name, {
            adapters: ['node-http', 'fetch'],
            persister: 'fs',
            recordIfMissing: true,
            matchRequestsBy: {
                headers: false,
                url: { hostname: false },
            },
            persisterOptions: { fs: { recordingsDir } },
            ...(options || {}),
        })

        polly.server.any().on('beforePersist', (req, recording) => {
            recording.request = {
                ...req,
                headers: {
                    ...req.headers,
                    ...(req.headers.authorization ? { authorization: 'Bearer <redacted>' } : {}),
                },
                requestArguments: {
                    ...req.requestArguments,
                    ...((req.requestArguments as { options: Record<string, unknown> }).options
                        ? {
                              options: {
                                  ...(req.requestArguments as { options: Record<string, unknown> })
                                      .options,
                                  headers: {},
                              },
                          }
                        : {}),
                },
            }

            scrubTokens(recording.request)
            scrubTokens(recording.response)
        })
    })

    afterEach(async () => {
        await polly.stop()
    })
}
