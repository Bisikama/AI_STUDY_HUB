'use client';

import useSWR from 'swr';
import { adminApi } from '@/services/adminApi';

interface Metrics {
  totalUsers: number;
  totalDocuments: number;
  totalStorage: number;
}

export const useAdminMetrics = () => {
  const { data: metrics, error, isLoading } = useSWR<Metrics>(
    'admin-metrics',
    adminApi.getMetrics,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return { metrics, loading: isLoading, error: error?.message || null };
};
