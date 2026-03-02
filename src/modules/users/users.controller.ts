import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  Get,
  Patch,
  UseGuards,
  Req,
  Query,
  Delete,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { RefreshCookieInterceptor } from 'src/modules/auth/interceptors/refresh-cookie.interceptor';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/type/auth.type';
import { UpdateUserDto } from './dto/update-user.dto';

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

  @Get('/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @HttpCode(200)
  findUserById(
    @Req() request: AuthenticatedRequest,
    @Query('id') queryUserId?: string,
  ) {
    return this.usersService.findOne({
      requesterId: request.user.sub,
      requesterRole: request.user.role,
      queryUserId,
    });
  }

  @Get('/email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(200)
  findUserByEmail(@Query('key') key: string) {
    return this.usersService.findUserByEmail(key);
  }

  @Patch('/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @HttpCode(200)
  updateUser(
    @Req() request: AuthenticatedRequest,
    @Query('id') queryUserId: string | undefined,
    @Body() updateData: UpdateUserDto,
  ) {
    return this.usersService.updateUser({
      requesterId: request.user.sub,
      requesterRole: request.user.role,
      queryUserId,
      updateData,
    });
  }

  @Delete('/delete/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(204)
  deleteUser(@Param('key') key: string) {
    return this.usersService.deleteUser(key);
  }
}
