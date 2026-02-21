import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { setRefreshTokenCookie } from '../utils/refresh-cookie.util';

type TokenPayload = {
  accessToken?: string;
  refreshToken?: string;
};

type AuthResponse = {
  tokens?: TokenPayload;
  [key: string]: unknown;
};

@Injectable()
export class RefreshCookieInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();

    return next.handle().pipe(
      map((data: AuthResponse) => {
        if (!data?.tokens?.refreshToken) {
          return data;
        }

        setRefreshTokenCookie(response, data.tokens.refreshToken);

        return {
          ...data,
          tokens: {
            accessToken: data.tokens.accessToken,
          },
        };
      }),
    );
  }
}
