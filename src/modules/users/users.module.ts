import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MailModule } from 'src/common/mail/mail.module';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [MailModule, AuthModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
