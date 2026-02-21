import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import type { AuthenticatedRequest } from './type/auth.type';
import { RefreshCookieInterceptor } from 'src/modules/auth/interceptors/refresh-cookie.interceptor';
import { clearRefreshTokenCookie } from 'src/modules/auth/utils/refresh-cookie.util';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseInterceptors(RefreshCookieInterceptor)
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @UseInterceptors(RefreshCookieInterceptor)
  refresh(@Req() req: AuthenticatedRequest) {
    return this.authService.refreshTokens(req.user.sub, req.user.refreshToken!);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    clearRefreshTokenCookie(res);
    return this.authService.logout(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@Req() req: AuthenticatedRequest) {
    return {
      message: 'Authorized user',
      user: req.user,
    };
  }
}
