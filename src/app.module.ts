import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './config/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { MailModule } from './common/mail/mail.module';

@Module({
  imports: [PrismaModule, UsersModule, MailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
