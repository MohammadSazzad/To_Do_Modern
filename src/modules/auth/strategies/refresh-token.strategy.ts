import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

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

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(req: Request, payload: JwtPayload) {
    const authHeader = req.get('authorization') ?? '';
    const refreshToken = authHeader.replace('Bearer ', '').trim();

    return {
      sub: payload.sub,
      email: payload.email,
      refreshToken,
    };
  }
}
