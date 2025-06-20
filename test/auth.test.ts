import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthorizationCodePKCEAuth } from '../src/auth/AuthorizationCodePKCEAuth'
import { ClientCredentialsAuth } from '../src/auth/ClientCredentialsAuth'

describe('ClientCredentialsAuth', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(1_000)
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('refreshes token and sets access token and expiry', async () => {
        const fakeResp = {
            ok: true,
            status: 200,
            json: async () => ({ access_token: 'tok', expires_in: 60 }),
        }
        const fetchMock = vi.fn().mockResolvedValue(fakeResp)
        vi.stubGlobal('fetch', fetchMock)
        const auth = new ClientCredentialsAuth({
            tokenUrl: 'url',
            clientId: 'id',
            clientSecret: 'sec',
            audience: 'aud',
        })
        await auth._refreshToken()
        expect(auth.accessToken).toBe('tok')
        expect(auth.expiresAt).toBe(1 + 60 - 60)
        expect(fetchMock).toHaveBeenCalledWith('url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: expect.any(URLSearchParams),
        })
    })

    it('adds Authorization header when authFlow called', async () => {
        const fakeResp = {
            ok: true,
            status: 200,
            json: async () => ({ access_token: 'tok', expires_in: 60 }),
        }
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeResp))
        const auth = new ClientCredentialsAuth({
            tokenUrl: 'url',
            clientId: 'id',
            clientSecret: 'sec',
            audience: 'http://api',
        })
        const req = new Request('http://api/test')
        const gen = auth.authFlow(req, true)
        const { value: out } = await gen.next()
        expect(out.headers.get('Authorization')).toBe('Bearer tok')
    })
})

describe('AuthorizationCodePKCEAuth', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(2_000)
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('refreshes token and sets access, refresh token, and expiry', async () => {
        const fakeResp = {
            ok: true,
            status: 200,
            json: async () => ({ access_token: 'at', refresh_token: 'rt', expires_in: 120 }),
        }
        const fetchMock = vi.fn().mockResolvedValue(fakeResp)
        vi.stubGlobal('fetch', fetchMock)
        const auth = new AuthorizationCodePKCEAuth({
            tokenUrl: 'url',
            clientId: 'cid',
            code: 'code',
            redirectUri: 'redir',
            codeVerifier: 'ver',
            scope: 's',
            audience: 'aud',
        })
        await auth._refreshToken()
        expect(auth.accessToken).toBe('at')
        expect(auth.refreshToken).toBe('rt')
        expect(auth.expiresAt).toBeGreaterThanOrEqual(0)
        const call = (fetchMock as any).mock.calls[0]
        expect(call[0]).toBe('url')
        const params = call[1].body as URLSearchParams
        expect(params.get('grant_type')).toBe('authorization_code')
        expect(params.get('client_id')).toBe('cid')
        expect(params.get('code')).toBe('code')
        expect(params.get('redirect_uri')).toBe('redir')
        expect(params.get('code_verifier')).toBe('ver')
    })

    it('authFlow sets header only for matching audience host', async () => {
        const fakeResp = {
            ok: true,
            status: 200,
            json: async () => ({ access_token: 'tok', expires_in: 600 }),
        }
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeResp))
        const auth = new AuthorizationCodePKCEAuth({
            tokenUrl: 'url',
            clientId: 'c',
            code: 'co',
            redirectUri: 'r',
            codeVerifier: 'v',
            audience: 'http://api',
        })
        const client = { baseUrl: 'http://api.com' }
        const req1 = new Request('http://api.com/x')
        const { value: out1 } = await auth.authFlow(req1, client).next()
        expect(out1.headers.get('Authorization')).toBe('Bearer tok')
        const req2 = new Request('http://other.com/x')
        const { value: out2 } = await auth.authFlow(req2, client).next()
        expect(out2).toBe(req2)
    })
})
