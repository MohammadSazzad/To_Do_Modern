import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { PrismaService } from 'src/config/database.config';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { resolveJwtExpiresIn } from './utils/token-expiry.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private normalizeRole(role: string) {
    return role.toLowerCase();
  }

  private async generateTokenPair(userId: string, email: string, role: string) {
    const accessSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    const accessExpiresIn = resolveJwtExpiresIn(
      process.env.ACCESS_TOKEN_EXPIRES_IN,
      '15m',
    );
    const refreshExpiresIn = resolveJwtExpiresIn(
      process.env.REFRESH_TOKEN_EXPIRES_IN,
      '7d',
    );

    const payload = { sub: userId, email, role: this.normalizeRole(role) };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.users.update({
      where: { id: userId },
      data: { refreshHash },
    });
  }

  async issueTokensForUser(user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  }) {
    const normalizedRole = this.normalizeRole(user.role);
    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: normalizedRole,
      },
    };
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    const user = await this.prisma.users.findUnique({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }
    if (!user.verified) {
      throw new BadRequestException('User is not verified');
    }

    const authResult = await this.issueTokensForUser({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    });

    return {
      message: 'Login successful',
      ...authResult,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshHash) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshHash);
    if (!isMatch) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const authResult = await this.issueTokensForUser({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    });

    return {
      message: 'Token refreshed successfully',
      ...authResult,
    };
  }

  async logout(userId: string) {
    await this.prisma.users.update({
      where: { id: userId },
      data: { refreshHash: null },
    });

    return { message: 'Logout successful' };
  }
}
