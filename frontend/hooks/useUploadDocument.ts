'use client';

import useSWRMutation from 'swr/mutation';
import { documentsApi, UploadDocumentPayload, UploadDocumentResponse } from '@/services/documentsApi';

/**
 * SWR mutation key for document upload.
 * Using a constant key so it can be referenced for cache invalidation.
 */
export const UPLOAD_DOCUMENT_KEY = '/api/documents/upload';

/**
 * Fetcher function for SWR mutation.
 * The `arg` param receives the payload passed to `trigger(payload)`.
 */
async function uploadFetcher(
  _key: string,
  { arg }: { arg: UploadDocumentPayload },
): Promise<UploadDocumentResponse> {
  return documentsApi.upload(arg);
}

/**
 * useUploadDocument
 *
 * SWR mutation hook to upload a document.
 *
 * Usage:
 *   const { trigger, isMutating, error, data } = useUploadDocument();
 *   await trigger({ file, title, description, subjectId });
 */
export function useUploadDocument() {
  const { trigger, isMutating, error, data, reset } = useSWRMutation<
    UploadDocumentResponse,
    Error,
    string,
    UploadDocumentPayload
  >(UPLOAD_DOCUMENT_KEY, uploadFetcher);

  return { trigger, isMutating, error, data, reset };
}
