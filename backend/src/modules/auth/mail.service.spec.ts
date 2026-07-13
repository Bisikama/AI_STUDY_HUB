import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';

// Mock Resend class
const mockSend = jest.fn();
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: mockSend,
        },
      };
    }),
  };
});

describe('MailService', () => {
  let service: MailService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'RESEND_API_KEY') return 're_test_key';
      if (key === 'RESEND_FROM') return 'Test <onboarding@resend.dev>';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtp', () => {
    it('should send email successfully and return true', async () => {
      mockSend.mockResolvedValue({ data: { id: 'test-id' }, error: null });
      const result = await service.sendOtp('user@example.com', '123456');
      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['user@example.com'],
          from: 'Test <onboarding@resend.dev>',
          subject: '[ScholarHub] Verification Code: 123456',
        }),
      );
    });

    it('should handle API error and return false', async () => {
      mockSend.mockResolvedValue({ data: null, error: { message: 'Invalid API Key' } });
      const result = await service.sendOtp('user@example.com', '123456');
      expect(result).toBe(false);
    });

    it('should catch generic exception and return false', async () => {
      mockSend.mockRejectedValue(new Error('Network Fail'));
      const result = await service.sendOtp('user@example.com', '123456');
      expect(result).toBe(false);
    });
  });

  describe('sendDocumentRejection', () => {
    it('should print logs and return true', async () => {
      const result = await service.sendDocumentRejection(
        'user@example.com',
        'John Doe',
        'Thesis PDF',
        'Spam content',
      );
      expect(result).toBe(true);
    });
  });
});
