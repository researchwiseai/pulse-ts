/**
 * Configuration constants for environment variable keys and default values.
 */
export const ENV_VAR = {
    BASE_URL: 'PULSE_BASE_URL',
    TOKEN_URL: 'PULSE_TOKEN_URL',
    AUTHORIZE_URL: 'PULSE_AUTHORIZE_URL',
    REDIRECT_URI: 'PULSE_REDIRECT_URI',
    SCOPE: 'PULSE_SCOPE',
    AUDIENCE: 'PULSE_AUDIENCE',
    CLIENT_ID: 'PULSE_CLIENT_ID',
    CLIENT_SECRET: 'PULSE_CLIENT_SECRET',
    CODE: 'PULSE_CODE',
    CODE_VERIFIER: 'PULSE_CODE_VERIFIER',
    DEBUG_PROXY: 'DEBUG_PROXY',
    DEBUG_LOGGING: 'DEBUG_LOGGING',
} as const

export const DEFAULTS = {
    BASE_URL: 'https://core.researchwiseai.com/pulse/v1',
    TOKEN_URL: 'https://research-wise-ai-eu.eu.auth0.com/oauth/token',
    REDIRECT_URI: 'http://localhost:3000/callback',
    SCOPE: 'openid profile email offline_access',
    AUDIENCE: 'https://core.researchwiseai.com/pulse/v1',
    TIMEOUT: 30000,
    RETRIES: 1,
} as const
