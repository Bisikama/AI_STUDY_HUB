import { act, renderHook } from '@testing-library/react';
import { useAuth } from './useAuth';
import { authApi } from '../services/authApi';
import { safeNavigateTo } from '../utils/navigation';

jest.mock('../utils/navigation', () => ({
  safeNavigateTo: jest.fn(),
}));

jest.mock('../services/authApi', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    checkEmail: jest.fn(),
    checkPassword: jest.fn(),
    loginWithGoogle: jest.fn(),
    getProfile: jest.fn(),
  },
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  it('should initialize with loading false and error null', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('login', () => {
    it('should set loading, call authApi.login, and store user & cookie on success', async () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'STUDENT' };
      (authApi.login as jest.Mock).mockResolvedValue({
        data: { user: mockUser, token: 'fake-token' },
      });

      const { result } = renderHook(() => useAuth());

      let user;
      await act(async () => {
        user = await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      expect(user).toEqual(mockUser);
      expect(authApi.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
      expect(document.cookie).toContain('access_token=fake-token');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set error on failure', async () => {
      const mockError = { response: { data: { message: 'Invalid credentials' } } };
      (authApi.login as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(
          result.current.login({ email: 'test@example.com', password: 'wrong' }),
        ).rejects.toBe('Invalid credentials');
      });

      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear localStorage and cookie on logout', async () => {
      localStorage.setItem('user', JSON.stringify({ id: '1' }));
      document.cookie = 'access_token=token';

      (authApi.logout as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(authApi.logout).toHaveBeenCalled();
      expect(localStorage.getItem('user')).toBeNull();
      expect(safeNavigateTo).toHaveBeenCalledWith('/login');
    });
  });
});
