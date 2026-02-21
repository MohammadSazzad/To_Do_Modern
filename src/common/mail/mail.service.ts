import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendMail(email: string, otp: string) {
    const host = process.env.MAIL_HOST;
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;
    const from = process.env.MAIL_FROM;
    const port = Number(process.env.MAIL_PORT);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    try {
      const info = await transporter.sendMail({
        from,
        to: email,
        subject: 'Your OTP for To-Do App',
        text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
      });

      this.logger.log(
        `OTP mail sent to ${email}. MessageId: ${info.messageId}`,
      );
      return info;
    } catch (error) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.error(`Failed to send OTP mail to ${email}`, trace);
      throw new InternalServerErrorException('Failed to send OTP email');
    }
  }
}
