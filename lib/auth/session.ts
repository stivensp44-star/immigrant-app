export const AUTH_ACCESS_TOKEN_COOKIE = 'tc-access-token'
export const AUTH_REFRESH_TOKEN_COOKIE = 'tc-refresh-token'

export const authCookieOptions = {
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

