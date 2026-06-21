import useSWR from 'swr';
import { documentsApi } from '@/services/documentsApi';

export function useMyDocuments() {
  const { data, error, isLoading, mutate } = useSWR(
    '/documents/me',
    () => documentsApi.getMyDocuments()
  );

  return {
    documents: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
