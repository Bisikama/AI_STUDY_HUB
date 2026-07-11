import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock next/script to render dummy component
jest.mock('next/script', () => {
  return function MockScript({ onLoad }: { onLoad?: () => void }) {
    React.useEffect(() => {
      if (onLoad) onLoad();
    }, [onLoad]);
    return <div data-testid="mock-script" />;
  };
});

describe('LoginPage Component', () => {
  let mockRouter: any;
  let mockLogin: jest.Mock;
  let mockLoginWithGoogle: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter = {
      push: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    mockLogin = jest.fn();
    mockLoginWithGoogle = jest.fn();

    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      loginWithGoogle: mockLoginWithGoogle,
    });
  });

  it('should render form fields and submit button', () => {
    render(<LoginPage />);

    expect(screen.getByPlaceholderText('name@university.edu')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('should display validation errors if fields are empty and submitted', async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Email cannot be empty')).toBeInTheDocument();
      expect(screen.getByText('Password cannot be empty')).toBeInTheDocument();
    });
  });

  it('should display error if email format is invalid', async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('name@university.edu'), {
      target: { value: 'invalid-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('should submit login with credentials and redirect to /admin if user is admin', async () => {
    mockLogin.mockResolvedValue({ role: 'ADMIN' });
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('name@university.edu'), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@test.com',
        password: 'password123',
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/admin');
    });
  });

  it('should submit login with credentials and redirect to / if user is student/teacher', async () => {
    mockLogin.mockResolvedValue({ role: 'STUDENT' });
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('name@university.edu'), {
      target: { value: 'student@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'student@test.com',
        password: 'password123',
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('should show global error message if useAuth has apiError', () => {
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Tài khoản không chính xác hoặc đã bị khóa',
      loginWithGoogle: mockLoginWithGoogle,
    });

    render(<LoginPage />);

    expect(screen.getByText('Tài khoản không chính xác hoặc đã bị khóa')).toBeInTheDocument();
  });
});
