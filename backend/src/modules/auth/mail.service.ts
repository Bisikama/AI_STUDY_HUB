import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress = 'noreply@aistudyhub.com';

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM');

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: { user, pass },
      });
      if (from) {
        this.fromAddress = from;
      }
      this.logger.log('🚀 SMTP Mailer configured successfully.');
    } else {
      this.logger.warn(
        '⚠️ SMTP config missing. MailService will log OTPs to the terminal console instead.',
      );
    }
  }

  async sendOtp(to: string, otp: string): Promise<boolean> {
    const subject = 'AI Study Hub - Mã OTP khôi phục mật khẩu';
    const textContent = `Mã OTP khôi phục mật khẩu của bạn là: ${otp}. Mã này có hiệu lực trong 10 phút.`;
    const htmlContent = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 500px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #0F172A; margin-bottom: 20px;">AI Study Hub</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu từ bạn. Hãy sử dụng mã OTP dưới đây để tiến hành đặt lại mật khẩu mới:</p>
        <div style="background-color: #F8F9FA; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #2563EB;">${otp}</span>
        </div>
        <p style="color: #64748B; font-size: 13px;">Mã OTP này có hiệu lực trong vòng <b>10 phút</b>. Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #94A3B8; font-size: 11px; text-align: center;">AI Study Hub &copy; 2026. All rights reserved.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to,
          subject,
          text: textContent,
          html: htmlContent,
        });
        this.logger.log(`✅ Mail OTP sent successfully to: ${to}`);
        return true;
      } catch (error) {
        this.logger.error(`❌ Failed to send SMTP mail to ${to}:`, error);
      }
    }

    // Fallback: in mã ra console cực kỳ rõ ràng để dev test
    console.log('\n==================================================');
    console.log(`✉️  [MAIL SERVICE - MOCK OTP SENDER]`);
    console.log(`👉  Gửi đến: ${to}`);
    console.log(`🔑  MÃ OTP RESET PASSWORD: ${otp}`);
    console.log(`⏱️  Hết hạn sau: 10 phút`);
    console.log('==================================================\n');
    return false;
  }
}
