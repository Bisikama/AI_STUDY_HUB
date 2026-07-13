import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.logger.log('🚀 Resend email client initialized.');
  }

  async sendOtp(to: string, otp: string): Promise<boolean> {
    try {
      const from =
        this.configService.get<string>('RESEND_FROM') || 'ScholarHub <onboarding@resend.dev>';
      
      const { data, error } = await this.resend.emails.send({
        from,
        to: [to],
        subject: `[ScholarHub] Verification Code: ${otp}`,
        html: `
          <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937; line-height: 1.6;">
            <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #f3f4f6;">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">ScholarHub</h1>
                <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">Academic Document Management System</p>
              </div>

              <!-- Body -->
              <div style="padding: 40px 32px;">
                <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 16px;">Reset Your Password</h2>
                <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px;">Hello,</p>
                <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">We received a request to reset the password for your ScholarHub account. Please use the following One-Time Password (OTP) to complete the verification process:</p>
                
                <!-- OTP Display -->
                <div style="text-align: center; margin: 32px 0;">
                  <div style="display: inline-block; background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 32px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1d4ed8; display: inline-block; margin-left: 8px;">${otp}</span>
                  </div>
                </div>

                <!-- Expiry Alert -->
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 12px 16px; margin-bottom: 28px;">
                  <p style="margin: 0; font-size: 14px; color: #b45309; font-weight: 500;">
                    ⏰ This verification code is only valid for <strong>10 minutes</strong>.
                  </p>
                </div>

                <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 15px;">If you did not request this password reset, you can safely ignore this email.</p>
                <p style="margin: 0; color: #9ca3af; font-size: 14px; font-style: italic;">Your account security is important to us. Please do not share this code with anyone.</p>
              </div>

              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; font-weight: 500;">&copy; 2026 ScholarHub. All rights reserved.</p>
                <p style="margin: 0; font-size: 11px; color: #9ca3af;">This is an automated email. Please do not reply directly to this message.</p>
              </div>

            </div>
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
        `❌ Lỗi gửi email OTP qua Resend: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  async sendDocumentRejection(to: string, fullName: string, docTitle: string, reason: string): Promise<boolean> {
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
