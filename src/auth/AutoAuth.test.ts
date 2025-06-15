import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AutoAuth } from './AutoAuth'
import { AuthorizationCodePKCEAuth } from './AuthorizationCodePKCEAuth'
import { ClientCredentialsAuth } from './ClientCredentialsAuth'
import type { Auth } from './types'

// Mock the underlying auth implementations
vi.mock('./AuthorizationCodePKCEAuth')
vi.mock('./ClientCredentialsAuth')

describe('AutoAuth', () => {
    let mockPKCEAuthInstance: AuthorizationCodePKCEAuth
    let mockCCAuthInstance: ClientCredentialsAuth

    async function testAuthFlow(auth: AutoAuth, mockRequest: Request, chosenAuthImpl: Auth) {
        const generator = auth.authFlow(mockRequest)
        let result = await generator.next()
        expect(result.value).toBe(mockRequest)
        expect(result.done).toBe(false)
        result = await generator.next()
        expect(result.value).toBe(mockRequest)
        expect(result.done).toBe(true)

        expect(chosenAuthImpl.authFlow).toHaveBeenCalledWith(mockRequest)
    }

    beforeEach(() => {
        // Reset mocks before each test
        vi.resetAllMocks()

        // Mock instances
        mockPKCEAuthInstance = {
            accessToken: 'pkce_access_token',
            refreshToken: 'pkce_refresh_token',
            expiresAt: 1234567890,
            _refreshToken: vi.fn().mockResolvedValue(undefined),
            authFlow: vi.fn(async function* (req: Request) {
                yield req
                return req
            }),
        } as unknown as AuthorizationCodePKCEAuth

        mockCCAuthInstance = {
            accessToken: 'cc_access_token',
            refreshToken: undefined,
            expiresAt: 9876543210,
            _refreshToken: vi.fn().mockResolvedValue(undefined),
            authFlow: vi.fn(async function* (req: Request) {
                yield req
                return req
            }),
        } as unknown as ClientCredentialsAuth

        // Mock constructors to return our mock instances
        vi.mocked(AuthorizationCodePKCEAuth).mockImplementation(() => mockPKCEAuthInstance)
        vi.mocked(ClientCredentialsAuth).mockImplementation(() => mockCCAuthInstance)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('isAvailable', () => {
        it('should return true if AuthorizationCodePKCEAuth is available', () => {
            vi.mocked(AuthorizationCodePKCEAuth.isAvailable).mockReturnValue(true)
            vi.mocked(ClientCredentialsAuth.isAvailable).mockReturnValue(false)
            expect(AutoAuth.isAvailable()).toBe(true)
        })

        it('should return true if ClientCredentialsAuth is available', () => {
            vi.mocked(AuthorizationCodePKCEAuth.isAvailable).mockReturnValue(false)
            vi.mocked(ClientCredentialsAuth.isAvailable).mockReturnValue(true)
            expect(AutoAuth.isAvailable()).toBe(true)
        })

        it('should return true if both are available', () => {
            vi.mocked(AuthorizationCodePKCEAuth.isAvailable).mockReturnValue(true)
            vi.mocked(ClientCredentialsAuth.isAvailable).mockReturnValue(true)
            expect(AutoAuth.isAvailable()).toBe(true)
        })

        it('should return false if neither is available', () => {
            vi.mocked(AuthorizationCodePKCEAuth.isAvailable).mockReturnValue(false)
            vi.mocked(ClientCredentialsAuth.isAvailable).mockReturnValue(false)
            expect(AutoAuth.isAvailable()).toBe(false)
        })
    })

    describe('constructor', () => {
        it('should use AuthorizationCodePKCEAuth if available', () => {
            vi.mocked(AuthorizationCodePKCEAuth.isAvailable).mockReturnValue(true)
            vi.mocked(ClientCredentialsAuth.isAvailable).mockReturnValue(false)
            const auth = new AutoAuth()
            expect(AuthorizationCodePKCEAuth).toHaveBeenCalledTimes(1)
            expect(ClientCredentialsAuth).not.toHaveBeenCalled()
            expect((auth as any).authImpl).toBe(mockPKCEAuthInstance)
        })

        it('should use ClientCredentialsAuth if AuthorizationCodePKCEAuth is not available but ClientCredentialsAuth is', () => {
            vi.mocked(AuthorizationCodePKCEAuth.isAvailable).mockReturnValue(false)
            vi.mocked(ClientCredentialsAuth.isAvailable).mockReturnValue(true)
            const auth = new AutoAuth()
            expect(ClientCredentialsAuth).toHaveBeenCalledTimes(1)
            expect(AuthorizationCodePKCEAuth).not.toHaveBeenCalled()
            expect((auth as any).authImpl).toBe(mockCCAuthInstance)
        })

        it('should prioritize AuthorizationCodePKCEAuth if both are available', () => {
            vi.mocked(AuthorizationCodePKCEAuth.isAvailable).mockReturnValue(true)
            vi.mocked(ClientCredentialsAuth.isAvailable).mockReturnValue(true)
            const auth = new AutoAuth()
            expect(AuthorizationCodePKCEAuth).toHaveBeenCalledTimes(1)
            expect(ClientCredentialsAuth).not.toHaveBeenCalled()
            expect((auth as any).authImpl).toBe(mockPKCEAuthInstance)
        })

        it('should throw an error if no authentication method is available', () => {
            vi.mocked(AuthorizationCodePKCEAuth.isAvailable).mockReturnValue(false)
            vi.mocked(ClientCredentialsAuth.isAvailable).mockReturnValue(false)
            expect(() => new AutoAuth()).toThrow(
                'No authentication method available. Set environment variables for Authorization Code PKCE or Client Credentials flow.',
            )
        })
    })

    describe('delegated methods and properties', () => {
        let auth: AutoAuth
        let chosenAuthImpl: Auth

        beforeEach(() => {
            // Default to PKCE for these tests
            vi.mocked(AuthorizationCodePKCEAuth.isAvailable).mockReturnValue(true)
            vi.mocked(ClientCredentialsAuth.isAvailable).mockReturnValue(false)
            auth = new AutoAuth()
            chosenAuthImpl = mockPKCEAuthInstance
        })

        it('should delegate accessToken getter', () => {
            expect(auth.accessToken).toBe(chosenAuthImpl.accessToken)
        })

        it('should delegate refreshToken getter', () => {
            expect(auth.refreshToken).toBe(chosenAuthImpl.refreshToken)
        })

        it('should delegate expiresAt getter', () => {
            expect(auth.expiresAt).toBe(chosenAuthImpl.expiresAt)
        })

        it('should delegate _refreshToken method', async () => {
            await auth._refreshToken()
            expect(chosenAuthImpl._refreshToken).toHaveBeenCalledTimes(1)
        })

        it('should delegate authFlow method', async () => {
            const mockRequest = new Request('http://localhost')
            await testAuthFlow(auth, mockRequest, chosenAuthImpl)
        })

        describe('when ClientCredentialsAuth is chosen', () => {
            beforeEach(() => {
                vi.mocked(AuthorizationCodePKCEAuth.isAvailable).mockReturnValue(false)
                vi.mocked(ClientCredentialsAuth.isAvailable).mockReturnValue(true)
                auth = new AutoAuth()
                chosenAuthImpl = mockCCAuthInstance
            })

            it('should delegate accessToken getter to ClientCredentialsAuth', () => {
                expect(auth.accessToken).toBe(chosenAuthImpl.accessToken)
            })

            it('should delegate refreshToken getter to ClientCredentialsAuth (undefined)', () => {
                expect(auth.refreshToken).toBe(chosenAuthImpl.refreshToken)
            })

            it('should delegate expiresAt getter to ClientCredentialsAuth', () => {
                expect(auth.expiresAt).toBe(chosenAuthImpl.expiresAt)
            })

            it('should delegate _refreshToken method to ClientCredentialsAuth', async () => {
                await auth._refreshToken()
                expect(chosenAuthImpl._refreshToken).toHaveBeenCalledTimes(1)
            })

            it('should delegate authFlow method to ClientCredentialsAuth', async () => {
                const mockRequest = new Request('http://localhost')
                await testAuthFlow(auth, mockRequest, chosenAuthImpl)
            })
        })
    })
})
