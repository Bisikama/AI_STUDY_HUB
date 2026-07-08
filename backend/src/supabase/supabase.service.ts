import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';
import * as path from 'path';
import { StorageAdapter } from './storage-adapter.interface';

@Injectable()
export class SupabaseService implements StorageAdapter {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly supabase: SupabaseClient;
  private readonly legacyBucketName: string;
  private readonly documentsBucketName: string;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseKey = this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    // For legacy uploads
    this.legacyBucketName =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'documents';

    // For private document uploads
    this.documentsBucketName = this.configService.getOrThrow<string>('SUPABASE_DOCUMENTS_BUCKET');

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        transport: WebSocket as any,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  private sanitizeFileName(fileName: string): string {
    const safeName = fileName.replace(/^.*[\\/]/, ''); // remove directory paths
    const ext = path.extname(safeName).toLowerCase();
    let nameWithoutExt = path.basename(safeName, ext);

    nameWithoutExt = nameWithoutExt
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_');

    if (!nameWithoutExt) {
      nameWithoutExt = 'document';
    }

    // return `${nameWithoutExt}${ext === '.pdf' ? '.pdf' : ''}`;
    return `${nameWithoutExt}${ext}`;
  }

  async uploadPrivate(input: {
    userId: string;
    documentId: string;
    fileName: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<{ storagePath: string }> {
    const sanitizedFileName = this.sanitizeFileName(input.fileName);
    const storagePath = `documents/${input.userId}/${input.documentId}/${sanitizedFileName}`;

    this.logger.log(`Start private upload to path: documents/[userId]/[documentId]`);

    const { error } = await this.supabase.storage
      .from(this.documentsBucketName)
      .upload(storagePath, input.buffer, {
        contentType: input.contentType,
        upsert: true,
      });

    if (error) {
      this.logger.error('Private upload failed: STORAGE_OPERATION_FAILED');
      throw new BadGatewayException('STORAGE_OPERATION_FAILED');
    }

    return { storagePath };
  }

  private clampTtl(expiresInSeconds?: number): number {
    const ttl = expiresInSeconds || 300;
    return Math.min(ttl, 300);
  }

  async createPreviewUrl(input: {
    storagePath: string;
    expiresInSeconds?: number;
  }): Promise<{ url: string; expiresAt: Date }> {
    const ttl = this.clampTtl(input.expiresInSeconds);

    const { data, error } = await this.supabase.storage
      .from(this.documentsBucketName)
      .createSignedUrl(input.storagePath, ttl);

    if (error || !data) {
      this.logger.error('Create preview URL failed: STORAGE_OPERATION_FAILED');
      throw new BadGatewayException('STORAGE_OPERATION_FAILED');
    }

    const expiresAt = new Date(Date.now() + ttl * 1000);
    return { url: data.signedUrl, expiresAt };
  }

  async createDownloadUrl(input: {
    storagePath: string;
    fileName: string;
    expiresInSeconds?: number;
  }): Promise<{ url: string; expiresAt: Date; fileName: string }> {
    const ttl = this.clampTtl(input.expiresInSeconds);

    const { data, error } = await this.supabase.storage
      .from(this.documentsBucketName)
      .createSignedUrl(input.storagePath, ttl, {
        download: input.fileName,
      });

    if (error || !data) {
      this.logger.error('Create download URL failed: STORAGE_OPERATION_FAILED');
      throw new BadGatewayException('STORAGE_OPERATION_FAILED');
    }

    const expiresAt = new Date(Date.now() + ttl * 1000);
    return { url: data.signedUrl, expiresAt, fileName: input.fileName };
  }

  async deleteObject(storagePath: string): Promise<void> {
    this.logger.log(`Deleting object at path: [redacted]`);

    const { error } = await this.supabase.storage
      .from(this.documentsBucketName)
      .remove([storagePath]);

    if (error) {
      this.logger.error('Delete object failed: STORAGE_OPERATION_FAILED');
      throw new BadGatewayException('STORAGE_OPERATION_FAILED');
    }
  }

  // ----------------------------------------------------------------------
  // LEGACY METHODS (to preserve backward compatibility)
  // ----------------------------------------------------------------------

  async uploadToSupabase(
    fileBuffer: Buffer,
    originalFileName: string,
    mimetype: string,
  ): Promise<string> {
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8);
    const safeFileName = originalFileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .replace(/-+/g, '-');

    const filePath = `documents/${timestamp}_${uniqueId}_${safeFileName}`;

    this.logger.log(`Start legacy uploading files to Supabase Storage: ${filePath}`);

    const { data, error } = await this.supabase.storage
      .from(this.legacyBucketName)
      .upload(filePath, fileBuffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Upload failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Unable to upload file to Supabase Storage: ${error.message}`,
      );
    }

    this.logger.log(`Upload successful. File path: ${data?.path}`);

    const { data: publicUrlData } = this.supabase.storage
      .from(this.legacyBucketName)
      .getPublicUrl(data!.path);

    return publicUrlData.publicUrl;
  }

  async deleteFromSupabase(publicUrl: string): Promise<void> {
    const urlObj = new URL(publicUrl);
    const pathParts = urlObj.pathname.split(`/object/public/${this.legacyBucketName}/`);

    if (pathParts.length < 2 || !pathParts[1]) {
      throw new Error(`Không thể parse file path từ URL: ${publicUrl}`);
    }

    const filePath = pathParts[1];

    this.logger.log(`Đang xóa file trên Supabase Storage: ${filePath}`);

    const { error } = await this.supabase.storage.from(this.legacyBucketName).remove([filePath]);

    if (error) {
      this.logger.error(`Xóa file thất bại: ${error.message}`, error.stack);
      throw new Error(`Supabase Storage xóa thất bại: ${error.message}`);
    }

    this.logger.log(`Đã xóa thành công file: ${filePath}`);
  }
}
