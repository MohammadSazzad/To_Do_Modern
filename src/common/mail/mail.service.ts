import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private buildOtpEmail(email: string, otp: string) {
    const subject = 'Your verification code for To-Do App';
    const text = [
      'Hello,',
      '',
      `Your verification code for To-Do App is ${otp}.`,
      'This code is valid for 5 minutes.',
      '',
      'If you did not request this email, you can safely ignore it.',
      '',
      'Regards,',
      'To-Do App Support',
    ].join('\n');

    const html = `
      <div style="margin:0;padding:0;background-color:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
        <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:40px;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
            <div style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;font-weight:700;">To-Do App</div>
            <h1 style="margin:16px 0 12px;font-size:28px;line-height:1.2;color:#111827;">Your verification code</h1>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#374151;">Hello${email ? ` ${email}` : ''}, use the code below to verify your account and continue with your sign-in.</p>
            <div style="display:inline-block;padding:18px 28px;border-radius:12px;background:#111827;color:#ffffff;font-size:32px;letter-spacing:0.2em;font-weight:700;">${otp}</div>
            <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#6b7280;">This code expires in 5 minutes. If you did not request this verification, you may ignore this message.</p>
            <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:14px;line-height:1.7;color:#4b5563;">
              <strong style="display:block;margin-bottom:4px;color:#111827;">Kind regards,</strong>
              <span>To-Do App Support</span>
            </div>
          </div>
        </div>
      </div>
    `;

    return { subject, text, html };
  }

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
      const message = this.buildOtpEmail(email, otp);

      const info = await transporter.sendMail({
        from,
        to: email,
        subject: message.subject,
        text: message.text,
        html: message.html,
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
