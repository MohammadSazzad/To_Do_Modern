import type { Response, CookieOptions } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

const getRefreshTokenMaxAge = () => {
  const refreshExpiresInSeconds = Number(process.env.REFRESH_TOKEN_EXPIRES_IN);

  if (
    !Number.isFinite(refreshExpiresInSeconds) ||
    refreshExpiresInSeconds <= 0
  ) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  return refreshExpiresInSeconds * 1000;
};

export const getRefreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/api/v1/auth',
  maxAge: getRefreshTokenMaxAge(),
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
});

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie(
    REFRESH_TOKEN_COOKIE_NAME,
    refreshToken,
    getRefreshCookieOptions(),
  );
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getRefreshCookieOptions());
};
