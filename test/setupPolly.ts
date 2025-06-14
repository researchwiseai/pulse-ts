import path from 'path'
import { fileURLToPath } from 'url'
import { Polly } from '@pollyjs/core'
import NodeHttpAdapter from '@pollyjs/adapter-node-http'
import FetchAdapter from '@pollyjs/adapter-fetch'
import FSPersister from '@pollyjs/persister-fs'
import { beforeEach, afterEach } from 'vitest'

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
                    ...((req.requestArguments as any).options
                        ? {
                              options: {
                                  ...(req.requestArguments as any).options,
                                  headers: {},
                              },
                          }
                        : {}),
                },
            }

            if (recording.request?.response?.body) {
                try {
                    const raw = recording.request.response.body
                    const body = typeof raw === 'string' ? JSON.parse(raw) : raw
                    if ('access_token' in body) body.access_token = '<redacted>'
                    if ('refresh_token' in body) body.refresh_token = '<redacted>'
                    recording.request.response.body = JSON.stringify(body)
                } catch {}
            }

            if (recording.response?.content?.text) {
                console.log('redacting response body', recording.response)
                try {
                    const body = JSON.parse(recording.response.content.text as string)
                    console.log('body', body)
                    if ('access_token' in body) body.access_token = '<redacted>'
                    if ('refresh_token' in body) body.refresh_token = '<redacted>'
                    recording.response.content.text = JSON.stringify(body)

                    console.log('redacted response body', recording.response)
                } catch {}
            }
        })
    })

    afterEach(async () => {
        await polly.stop()
    })
}
