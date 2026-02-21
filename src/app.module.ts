import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './config/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { MailModule } from './common/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [PrismaModule, UsersModule, MailModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
