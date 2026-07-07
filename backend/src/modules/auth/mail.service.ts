import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    this.logger.log('🚀 Supabase Mailer initialized.');
  }

  async sendOtp(to: string, otp: string): Promise<boolean> {
    try {
      const supabase = this.supabaseService.getClient();
      const redirectTo = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5000'}/reset-password`;

      // 1. Gọi Supabase Auth API để gửi yêu cầu reset password
      const { error } = await supabase.auth.resetPasswordForEmail(to, {
        redirectTo,
      });

      if (error) {
        this.logger.error(`❌ Supabase resetPasswordForEmail error: ${error.message}`);
      }

      // 2. Sử dụng Supabase Admin API để tạo trực tiếp Supabase Recovery Link và OTP
      const { data: adminData, error: adminError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: to,
        options: { redirectTo },
      });

      console.log('\n==================================================');
      console.log(`🔑 [SUPABASE AUTH RECOVERY LINK & OTP]`);
      console.log(`👉 Email: ${to}`);
      if (!adminError && adminData?.properties) {
        console.log(`🔗 Link Reset từ Supabase: ${adminData.properties.action_link}`);
        console.log(`🔢 Mã OTP Supabase: ${adminData.properties.email_otp}`);
      }
      console.log(`🔑 Mã OTP hệ thống của bạn: ${otp}`);
      console.log('==================================================\n');

      return true;
    } catch (error) {
      this.logger.error(
        `❌ Lỗi kết nối Supabase Mailer: ${error instanceof Error ? error.message : String(error)}`,
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
