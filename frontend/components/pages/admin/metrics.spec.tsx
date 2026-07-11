import React from 'react';
import { render, screen } from '@testing-library/react';
import MetricsPage from './metrics';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';

jest.mock('@/hooks/useAdminMetrics', () => ({
  useAdminMetrics: jest.fn(),
}));

describe('MetricsPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading status when loading is true', () => {
    (useAdminMetrics as jest.Mock).mockReturnValue({
      metrics: null,
      loading: true,
      error: null,
    });

    render(<MetricsPage />);

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('should render error message when error is present', () => {
    (useAdminMetrics as jest.Mock).mockReturnValue({
      metrics: null,
      loading: false,
      error: 'Fetch metrics failed',
    });

    render(<MetricsPage />);

    expect(screen.getByText('Error: Fetch metrics failed')).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('should render metric cards when data is loaded successfully', () => {
    (useAdminMetrics as jest.Mock).mockReturnValue({
      metrics: {
        totalUsers: 150,
        totalDocuments: 3200,
        totalStorage: 5368709120, // 5 GB in bytes
      },
      loading: false,
      error: null,
    });

    render(<MetricsPage />);

    expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    expect(screen.queryByText('Error:')).not.toBeInTheDocument();

    // Check card values
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('3200')).toBeInTheDocument();
    expect(screen.getByText('5.00 GB')).toBeInTheDocument();

    // Check card labels
    expect(screen.getByText('Total Registered Students')).toBeInTheDocument();
    expect(screen.getByText('Total Stored Files')).toBeInTheDocument();
    expect(screen.getByText('S3 / Supabase Storage')).toBeInTheDocument();
  });
});
