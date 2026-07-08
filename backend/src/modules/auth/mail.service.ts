import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: Number(this.configService.get<number>('SMTP_PORT') || 587),
      secure: false, // TLS
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
    this.logger.log('🚀 Gmail Nodemailer transporter initialized.');
  }

  async sendOtp(to: string, otp: string): Promise<boolean> {
    try {
      const from =
        this.configService.get<string>('SMTP_FROM') || 'ScholarHub <no-reply@scholarhub.com>';
      const mailOptions = {
        from,
        to,
        subject: `[ScholarHub] Mã xác thực OTP khôi phục mật khẩu`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; color: #333;">
            <h2 style="color: #1a73e8; margin-top: 0;">Khôi Phục Mật Khẩu</h2>
            <p>Chào bạn,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>ScholarHub</strong>. Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình này:</p>
            <div style="text-align: center; margin: 32px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1a73e8; background-color: #f1f3f4; padding: 12px 24px; border-radius: 4px; display: inline-block;">${otp}</span>
            </div>
            <p>Mã OTP này có hiệu lực trong vòng <strong>10 phút</strong>. Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email này.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #666; text-align: center; margin-bottom: 0;">ScholarHub - Hệ thống quản lý tài liệu học thuật trực tuyến</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`📧 OTP mail successfully sent to: ${to}`);
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Lỗi gửi email OTP qua Nodemailer: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
