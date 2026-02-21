import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { clearRefreshTokenCookie } from '../utils/refresh-cookie.util';
import type { Response } from 'express';

@Injectable()
export class ClearRefreshCookieInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        clearRefreshTokenCookie(response);
        return data;
      }),
    );
  }
}
