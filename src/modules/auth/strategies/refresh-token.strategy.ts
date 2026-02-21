import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { REFRESH_TOKEN_COOKIE_NAME } from '../utils/refresh-cookie.util';

type JwtPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    const secret = process.env.REFRESH_TOKEN_SECRET ?? 'refresh-secret-dev';
    const cookieExtractor = (req: Request) => {
      const cookies = (req as Request & { cookies?: Record<string, string> })
        .cookies;

      return cookies?.[REFRESH_TOKEN_COOKIE_NAME] ?? null;
    };

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      passReqToCallback: true,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(req: Request, payload: JwtPayload) {
    const cookies = (req as Request & { cookies?: Record<string, string> })
      .cookies;
    const refreshToken = cookies?.[REFRESH_TOKEN_COOKIE_NAME] ?? '';

    return {
      sub: payload.sub,
      email: payload.email,
      refreshToken,
    };
  }
}
