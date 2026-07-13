import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { ConflictException, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

jest.mock('bcrypt');
jest.mock('google-auth-library');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    storageUsage: {
      create: jest.fn(),
    },
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockMailService = {
    sendOtp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'STUDENT',
      });

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result.message).toBe('Đăng ký thành công!');
      expect(result.user.email).toBe('test@example.com');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            passwordHash: 'hashedPassword',
            fullName: 'Test User',
            role: 'STUDENT',
          }),
        }),
      );
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register({ email: 'test@example.com', password: 'password123', name: 'Test User' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully and return token', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        isActive: true,
        fullName: 'Test User',
        role: 'STUDENT',
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.token).toBe('jwt-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password incorrect', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if account is inactive', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        isActive: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('forgotPassword', () => {
    it('should return check email message if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');
      expect(result.message).toBe('Nếu tài khoản tồn tại, mã OTP sẽ được gửi về email.');
      expect(mockMailService.sendOtp).not.toHaveBeenCalled();
    });

    it('should delete existing tokens, create a new one, and send email if user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
      mockMailService.sendOtp.mockResolvedValue(true);

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toBe('Email khôi phục mật khẩu đã được gửi qua dịch vụ Supabase.');
      expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled();
      expect(mockMailService.sendOtp).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({ email: 'test@example.com', otp: '123456', password: 'newpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token not found or expired', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.passwordResetToken.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({ email: 'test@example.com', otp: '123456', password: 'newpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reset password successfully if otp and user are valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.passwordResetToken.findFirst.mockResolvedValue({ id: 'token-1' });
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      const result = await service.resetPassword({
        email: 'test@example.com',
        otp: '123456',
        password: 'newpassword',
      });

      expect(result.message).toBe('Đặt lại mật khẩu thành công!');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'newHashedPassword', provider: 'local' },
      });
      expect(mockPrisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: expect.objectContaining({ usedAt: expect.any(Date) }),
      });
    });
  });

  describe('getProfile', () => {
    it('should return profile of user if user exists', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'STUDENT',
        username: 'testuser',
        phoneNumber: '0123456789',
        avatarUrl: 'http://example.com/avatar.jpg',
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-1');
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'STUDENT',
        username: 'testuser',
        phoneNumber: '0123456789',
        avatarUrl: 'http://example.com/avatar.jpg',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateProfile', () => {
    it('should throw BadRequestException if username is already taken by another user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'other-user' });

      await expect(
        service.updateProfile('user-1', { fullName: 'New Name', username: 'taken' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update profile successfully if username is available', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // username not taken
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'New Name',
        username: 'newusername',
        phoneNumber: '0987654321',
        role: 'STUDENT',
      });

      const result = await service.updateProfile('user-1', {
        fullName: 'New Name',
        username: 'newusername',
        phoneNumber: '0987654321',
      });

      expect(result.message).toBe('Cập nhật thông tin tài khoản thành công!');
      expect(result.user.fullName).toBe('New Name');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          fullName: 'New Name',
          username: 'newusername',
          phoneNumber: '0987654321',
        },
      });
    });
  });
});
