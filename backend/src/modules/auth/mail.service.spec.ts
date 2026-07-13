import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let mockTransporter: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SMTP_HOST') return 'smtp.test.com';
      if (key === 'SMTP_PORT') return 587;
      if (key === 'SMTP_USER') return 'user@test.com';
      if (key === 'SMTP_PASS') return 'password';
      if (key === 'SMTP_FROM') return 'Test <no-reply@test.com>';
      return null;
    }),
  };

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    };
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

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
      const result = await service.sendOtp('user@example.com', '123456');
      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          from: 'Test <no-reply@test.com>',
          subject: '[ScholarHub] Verification Code: 123456',
        }),
      );
    });

    it('should catch error and return false', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Fail'));
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

