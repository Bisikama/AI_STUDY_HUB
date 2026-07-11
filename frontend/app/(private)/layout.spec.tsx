import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PrivateLayout from './layout';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/authApi';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/services/authApi', () => ({
  authApi: {
    getProfile: jest.fn(),
  },
}));

describe('PrivateLayout guard component', () => {
  let mockRouter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockRouter = {
      replace: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should show spinner initially while checking auth', async () => {
    (authApi.getProfile as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(
      <PrivateLayout>
        <div>Protected Content</div>
      </PrivateLayout>
    );

    expect(screen.getByText('sync')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children if getProfile returns user details successfully', async () => {
    (authApi.getProfile as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com' });

    render(
      <PrivateLayout>
        <div>Protected Content</div>
      </PrivateLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
    expect(screen.queryByText('sync')).not.toBeInTheDocument();
  });

  it('should clear user from localStorage and redirect to /login on auth failure', async () => {
    localStorage.setItem('user', JSON.stringify({ id: '1' }));
    (authApi.getProfile as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

    render(
      <PrivateLayout>
        <div>Protected Content</div>
      </PrivateLayout>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
    expect(localStorage.getItem('user')).toBeNull();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
