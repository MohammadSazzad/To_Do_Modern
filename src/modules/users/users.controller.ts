import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  Get,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { RefreshCookieInterceptor } from 'src/modules/auth/interceptors/refresh-cookie.interceptor';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @HttpCode(201)
  register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('verify')
  @HttpCode(200)
  @UseInterceptors(RefreshCookieInterceptor)
  verify(@Body() verifyUserDto: VerifyUserDto) {
    return this.usersService.verifyUser(verifyUserDto);
  }

  @Get('/')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(200)
  findAllUsers() {
    return this.usersService.findAllUsers();
  }
}
