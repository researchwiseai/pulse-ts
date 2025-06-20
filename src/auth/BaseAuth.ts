import type { Auth } from './types'
import * as Utils from '../utils'
import { ENV_VAR } from '../config'

export abstract class BaseAuth implements Partial<Auth> {
    protected _accessToken?: string
    protected _expiresAt?: number

    constructor(accessToken?: string, expiresAt?: number) {
        this._accessToken = accessToken
        this._expiresAt = expiresAt
    }

    async *authFlow(req: Request, client: { baseUrl: string } | boolean): AsyncGenerator<Request> {
        if (process.env[ENV_VAR.DEBUG_LOGGING])
            console.log(`Auth flow for ${Utils.getDomainFromString(req.url)}`)

        if (client === true) {
            if (process.env[ENV_VAR.DEBUG_LOGGING]) console.log('Forcing auth flow for all calls')
            if (!this._accessToken || !this._expiresAt || Date.now() / 1000 >= this._expiresAt) {
                await this._refreshToken()
            }
            const headers = new Headers(req.headers)
            headers.set('Authorization', `Bearer ${this._accessToken}`)
            yield new Request(req, { headers })
        } else if (client === false) {
            if (process.env[ENV_VAR.DEBUG_LOGGING]) console.log('Skipping auth flow for all calls')
            yield req
            return
        } else {
            if (process.env[ENV_VAR.DEBUG_LOGGING]) {
                console.log(
                    `Using auth flow for client at ${Utils.getDomainFromString(client.baseUrl)}`,
                )
                console.log(`Request URL: ${Utils.getDomainFromString(req.url)}`)
            }

            if (Utils.getDomainFromString(req.url) === Utils.getDomainFromString(client.baseUrl)) {
                if (
                    !this._accessToken ||
                    !this._expiresAt ||
                    Date.now() / 1000 >= this._expiresAt
                ) {
                    await this._refreshToken()
                }
                if (process.env[ENV_VAR.DEBUG_LOGGING])
                    console.log('Adding Authorization header with token')
                const headers = new Headers(req.headers)
                headers.set('Authorization', `Bearer ${this._accessToken}`)
                yield new Request(req, { headers })
            } else {
                if (process.env[ENV_VAR.DEBUG_LOGGING])
                    console.log('Skipping auth flow for external request')
                yield req
                return
            }
        }
    }

    abstract _refreshToken(): Promise<void>
}
