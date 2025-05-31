import path from 'path'
import { fileURLToPath } from 'url'
import { Polly } from '@pollyjs/core'
import NodeHttpAdapter from '@pollyjs/adapter-node-http'
import FSPersister from '@pollyjs/persister-fs'
import { beforeEach, afterEach } from 'vitest'

// Register Polly adapters and persisters
Polly.register(NodeHttpAdapter)
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
            adapters: ['node-http'],
            persister: 'fs',
            recordIfMissing: true,
            matchRequestsBy: {
                headers: false,
                url: { hostname: false },
            },
            persisterOptions: { fs: { recordingsDir } },
            ...(options || {}),
        })

        polly.server.any().on('beforePersist', (req, _res) => {
            req = {
                ...req,
                headers: {
                    ...req.headers,
                    ...(req.headers && { authorization: 'Bearer <redacted>' }),
                },
            }
        })
    })

    afterEach(async () => {
        await polly.stop()
    })
}
