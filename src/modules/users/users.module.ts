import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MailModule } from 'src/common/mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
