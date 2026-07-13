import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;

  constructor(private configService: ConfigService) {
    // Khởi tạo client Resend bằng API Key
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.logger.log('🚀 Resend email client initialized.');
  }

  async sendOtp(to: string, otp: string): Promise<boolean> {
    try {
      const from =
        this.configService.get<string>('RESEND_FROM') || 'ScholarHub <onboarding@resend.dev>';

      // Resend SDK trả về một object có chứa { data, error }
      const { data, error } = await this.resend.emails.send({
        from,
        to: [to], // Resend nhận danh sách người nhận là một mảng hoặc chuỗi
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
      });

      if (error) {
        this.logger.error(`❌ Lỗi gửi email OTP qua Resend API: ${error.message}`);
        return false;
      }

      this.logger.log(`📧 OTP mail successfully sent to: ${to} (ID: ${data?.id})`);
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Lỗi hệ thống khi gửi email OTP: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  async sendDocumentRejection(
    to: string,
    fullName: string,
    docTitle: string,
    reason: string,
  ): Promise<boolean> {
    try {
      console.log('\n==================================================');
      console.log(`✉️ [EMAIL NOTIFICATION - DOCUMENT REJECTED]`);
      console.log(`👉 To: ${fullName} <${to}>`);
      console.log(`📄 Document: "${docTitle}"`);
      console.log(`🚫 Reason: ${reason}`);
      console.log('==================================================\n');
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Lỗi gửi email thông báo từ chối: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
