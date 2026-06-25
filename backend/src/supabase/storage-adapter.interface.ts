export interface StorageAdapter {
  uploadPrivate(input: {
    userId: string;
    documentId: string;
    fileName: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<{ storagePath: string }>;

  createPreviewUrl(input: {
    storagePath: string;
    expiresInSeconds?: number;
  }): Promise<{
    url: string;
    expiresAt: Date;
  }>;

  createDownloadUrl(input: {
    storagePath: string;
    fileName: string;
    expiresInSeconds?: number;
  }): Promise<{
    url: string;
    expiresAt: Date;
    fileName: string;
  }>;

  deleteObject(storagePath: string): Promise<void>;

  // Legacy compatibility methods
  uploadToSupabase(
    fileBuffer: Buffer,
    originalFileName: string,
    mimetype: string,
  ): Promise<string>;

  deleteFromSupabase(publicUrl: string): Promise<void>;
}

export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');
