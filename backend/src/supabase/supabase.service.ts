import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';
@Injectable()
export class SupabaseService {
  // Logger giúp theo dõi lỗi mà không cần console.log thủ công
  private readonly logger = new Logger(SupabaseService.name);

  // Supabase client sẽ được khởi tạo một lần duy nhất (singleton pattern)
  private readonly supabase: SupabaseClient;

  // Tên bucket lấy từ biến môi trường để dễ thay đổi theo môi trường (dev/prod)
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    // Đọc các giá trị cấu hình từ biến môi trường
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseKey = this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.bucketName = this.configService.getOrThrow<string>('SUPABASE_STORAGE_BUCKET');

    // Khởi tạo Supabase client bằng Service Role Key (có quyền cao nhất phía server)
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        // Tắt auto refresh token vì đây là server-side client, không phải browser
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        transport: WebSocket as any,
      },
    });
  }

  //   async onModuleInit() {
  //     this.logger.log('🚀 Đang chạy giả lập Test Upload Supabase...');
  //     try {
  //       // Tạo một file text giả (Fake Buffer) ngay trong RAM
  //       const fakeFileBuffer = Buffer.from('Xin chao AI Study Hub! Day la file test.');
  //       const testFileName = 'test-ket-noi.txt';
  //       const testMimeType = 'text/plain';

  //       // Gọi chính cái hàm upload của ông
  //       const url = await this.uploadToSupabase(fakeFileBuffer, testFileName, testMimeType);

  //       this.logger.log(`✅ TEST THÀNH CÔNG RỰC RỠ!`);
  //       this.logger.log(`🔗 Bấm vào link này để xem thành quả: ${url}`);
  //     } catch (error) {
  //       this.logger.error(`❌ TEST THẤT BẠI! Cần kiểm tra lại .env hoặc mạng.`, error);
  //     }
  //   }

  /**
   * Upload một file lên Supabase Storage và trả về public URL của file đó.
   *
   * @param fileBuffer - Nội dung file dưới dạng Buffer (từ Multer)
   * @param originalFileName - Tên file gốc (ví dụ: "bai-giang.pdf")
   * @param mimetype - Loại MIME của file (ví dụ: "application/pdf")
   * @returns Promise<string> - Public URL để truy cập file
   */
  async uploadToSupabase(
    fileBuffer: Buffer,
    originalFileName: string,
    mimetype: string,
  ): Promise<string> {
    // Tạo path duy nhất để tránh ghi đè file cùng tên:
    // Ví dụ: "documents/1748950000000_a1b2c3d4_bai-giang.pdf"
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8); // Lấy 8 ký tự đầu của UUID cho ngắn gọn
    const safeFileName = originalFileName.replace(/\s+/g, '-'); // Thay khoảng trắng bằng dấu gạch ngang
    const filePath = `documents/${timestamp}_${uniqueId}_${safeFileName}`;

    this.logger.log(`Bắt đầu upload file lên Supabase Storage: ${filePath}`);

    // Thực hiện upload lên Supabase Storage
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, fileBuffer, {
        contentType: mimetype,
        // upsert: false đảm bảo không ghi đè file nếu trùng path (thêm lớp bảo vệ)
        upsert: false,
      });

    // Xử lý lỗi từ Supabase
    if (error) {
      this.logger.error(`Upload thất bại: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Không thể upload file lên Supabase Storage: ${error.message}`,
      );
    }

    this.logger.log(`Upload thành công. File path: ${data.path}`);

    // Lấy Public URL của file vừa upload
    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }
}
