import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from './supabase.service';
import { ConfigService } from '@nestjs/config';
import { BadGatewayException, Logger } from '@nestjs/common';

const mockUpload = jest.fn();
const mockCreateSignedUrl = jest.fn();
const mockRemove = jest.fn();
const mockGetPublicUrl = jest.fn();

const mockFrom = jest.fn().mockReturnValue({
  upload: mockUpload,
  createSignedUrl: mockCreateSignedUrl,
  remove: mockRemove,
  getPublicUrl: mockGetPublicUrl,
});

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    storage: {
      from: mockFrom,
    },
  })),
}));

describe('SupabaseService', () => {
  let service: SupabaseService;
  let configService: ConfigService;

  beforeEach(async () => {
    mockUpload.mockReset();
    mockCreateSignedUrl.mockReset();
    mockRemove.mockReset();
    mockGetPublicUrl.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
              if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'test-service-role-key';
              if (key === 'SUPABASE_DOCUMENTS_BUCKET') return 'test_documents_bucket';
              return undefined;
            }),
            get: jest.fn((key: string) => {
              if (key === 'SUPABASE_STORAGE_BUCKET') return 'test_legacy_bucket';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadPrivate', () => {
    it('creates deterministic sanitized path and does not call getPublicUrl', async () => {
      mockUpload.mockResolvedValue({ data: { path: 'some/path' }, error: null });

      const result = await service.uploadPrivate({
        userId: 'user123',
        documentId: 'doc456',
        fileName: '../../../danger\\file.name_!@#.pdf',
        buffer: Buffer.from('test'),
        contentType: 'application/pdf',
      });

      expect(mockUpload).toHaveBeenCalledWith(
        'documents/user123/doc456/file.name_.pdf',
        expect.any(Buffer),
        expect.objectContaining({ contentType: 'application/pdf', upsert: true }),
      );
      expect(result.storagePath).toBe('documents/user123/doc456/file.name_.pdf');
      expect(mockGetPublicUrl).not.toHaveBeenCalled();
    });

    it('preserves other extensions like .docx and .txt instead of discarding them', async () => {
      mockUpload.mockResolvedValue({ data: { path: 'some/path' }, error: null });

      const result = await service.uploadPrivate({
        userId: 'user123',
        documentId: 'doc456',
        fileName: 'report_file.docx',
        buffer: Buffer.from('test'),
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      expect(mockUpload).toHaveBeenCalledWith(
        'documents/user123/doc456/report_file.docx',
        expect.any(Buffer),
        expect.objectContaining({ contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', upsert: true }),
      );
      expect(result.storagePath).toBe('documents/user123/doc456/report_file.docx');
    });

    it('maps provider error to STORAGE_OPERATION_FAILED and avoids leaking service role key', async () => {
      const rawError = 'Provider network error containing test-service-role-key';
      mockUpload.mockResolvedValue({ data: null, error: { message: rawError } });

      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      await expect(
        service.uploadPrivate({
          userId: 'u1',
          documentId: 'd1',
          fileName: 'test.pdf',
          buffer: Buffer.from('test'),
          contentType: 'application/pdf',
        }),
      ).rejects.toThrow(new BadGatewayException('STORAGE_OPERATION_FAILED'));

      expect(loggerSpy).toHaveBeenCalledWith('Private upload failed: STORAGE_OPERATION_FAILED');
      expect(loggerSpy).not.toHaveBeenCalledWith(expect.stringContaining(rawError));
      expect(loggerSpy).not.toHaveBeenCalledWith(expect.stringContaining('test-service-role-key'));

      loggerSpy.mockRestore();
    });
  });

  describe('createPreviewUrl', () => {
    it('clamps TTL to 300 seconds max', async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://preview.url' },
        error: null,
      });

      const result = await service.createPreviewUrl({
        storagePath: 'documents/u1/d1/test.pdf',
        expiresInSeconds: 999, // Exceeds 300
      });

      expect(mockCreateSignedUrl).toHaveBeenCalledWith('documents/u1/d1/test.pdf', 300);
      expect(result.url).toBe('https://preview.url');
    });

    it('maps error to STORAGE_OPERATION_FAILED', async () => {
      const rawError = 'Provider error';
      mockCreateSignedUrl.mockResolvedValue({ data: null, error: { message: rawError } });
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      await expect(
        service.createPreviewUrl({ storagePath: 'documents/u1/d1/test.pdf' }),
      ).rejects.toThrow(new BadGatewayException('STORAGE_OPERATION_FAILED'));

      expect(loggerSpy).toHaveBeenCalledWith('Create preview URL failed: STORAGE_OPERATION_FAILED');
      expect(loggerSpy).not.toHaveBeenCalledWith(expect.stringContaining(rawError));
      loggerSpy.mockRestore();
    });
  });

  describe('createDownloadUrl', () => {
    it('clamps TTL to 300 seconds max and passes download filename', async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://download.url' },
        error: null,
      });

      const result = await service.createDownloadUrl({
        storagePath: 'documents/u1/d1/test.pdf',
        fileName: 'downloaded.pdf',
        expiresInSeconds: 999,
      });

      expect(mockCreateSignedUrl).toHaveBeenCalledWith('documents/u1/d1/test.pdf', 300, {
        download: 'downloaded.pdf',
      });
      expect(result.url).toBe('https://download.url');
    });

    it('maps error to STORAGE_OPERATION_FAILED', async () => {
      const rawError = 'Provider error';
      mockCreateSignedUrl.mockResolvedValue({ data: null, error: { message: rawError } });
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      await expect(
        service.createDownloadUrl({ storagePath: 'documents/u1/d1/test.pdf', fileName: 'dl.pdf' }),
      ).rejects.toThrow(new BadGatewayException('STORAGE_OPERATION_FAILED'));

      expect(loggerSpy).toHaveBeenCalledWith(
        'Create download URL failed: STORAGE_OPERATION_FAILED',
      );
      expect(loggerSpy).not.toHaveBeenCalledWith(expect.stringContaining(rawError));
      loggerSpy.mockRestore();
    });
  });

  describe('deleteObject', () => {
    it('ignores object not found (idempotent)', async () => {
      // Assuming Supabase returns no error when deleting non-existent object, or we ignore it.
      // Actually, if it returns success, it should not throw.
      mockRemove.mockResolvedValue({ data: [], error: null });

      await expect(service.deleteObject('documents/u1/d1/test.pdf')).resolves.toBeUndefined();
      await expect(service.deleteObject('documents/u1/d1/test.pdf')).resolves.toBeUndefined(); // Second time still works
    });

    it('maps real provider error to STORAGE_OPERATION_FAILED', async () => {
      const rawError = 'Actual error';
      mockRemove.mockResolvedValue({ data: null, error: { message: rawError } });
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      await expect(service.deleteObject('documents/u1/d1/test.pdf')).rejects.toThrow(
        new BadGatewayException('STORAGE_OPERATION_FAILED'),
      );

      expect(loggerSpy).toHaveBeenCalledWith('Delete object failed: STORAGE_OPERATION_FAILED');
      expect(loggerSpy).not.toHaveBeenCalledWith(expect.stringContaining(rawError));
      loggerSpy.mockRestore();
    });
  });
});
