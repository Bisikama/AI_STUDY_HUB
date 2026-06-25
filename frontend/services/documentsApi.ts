import axiosClient from "@/utils/axios";

export interface UploadDocumentPayload {
  file: File;
  title: string;
  description?: string;
  subjectId: number;
  tags?: string; // JSON string
}

export type SignedDocumentUrlResponse = {
  url: string;
  expiresAt: string;
  fileName: string;
  disposition: 'inline' | 'attachment';
};

export interface Document {
  id: string;
  title: string;
  description: string | null;
  subjectId: number;
  subject?: { id: number; name: string; code: string; isSystem: boolean } | null;
  fileSize: number;
  fileType: string;
  downloadCount: number;
  viewCount: number;
  visibilityStatus: 'PUBLIC' | 'PENDING_REVIEW' | 'PRIVATE';
  deletionStatus?: 'ACTIVE' | 'SOFT_DELETED' | 'DELETING' | 'DELETE_FAILED' | 'REMOVED';
  extractionStatus?: 'PENDING' | 'READY' | 'FAILED';
  aiStatus?: 'NOT_REQUESTED' | 'PROCESSING' | 'READY' | 'FAILED';
  pageCount?: number | null;
  isAIGenerated: boolean;
  isOwner?: boolean;
  isFollowed?: boolean;
  summary?: { id: string; documentId: string; summaryText: string; keyPoints: string | null; status: string; errorMessage: string | null } | null;
  quizzes?: any[];
  createdAt: string;
  updatedAt: string;
  requestedAt?: string | null;
  tags?: Array<{ documentId: string; tagId: number; tag: { id: number; name: string; slug: string; isSystem: boolean } }>;
}

export interface UploadDocumentResponse {
  id: string;
  title: string;
  description: string | null;
  subjectId: number;
  fileSize: number;
  fileType: string;
  visibilityStatus: string;
  deletionStatus: string;
  extractionStatus: string;
  aiStatus: string;
  pageCount: number | null;
  createdAt: string;
}

export const documentsApi = {
  /**
   * Upload a document file along with its metadata.
   * Uses multipart/form-data — axios will set the correct Content-Type automatically.
   */
  upload: async (payload: UploadDocumentPayload): Promise<UploadDocumentResponse> => {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("title", payload.title);
    if (payload.description) formData.append("description", payload.description);
    formData.append("subjectId", String(payload.subjectId));
    if (payload.tags) formData.append("tags", payload.tags);

    const response = await axiosClient.post<UploadDocumentResponse>(
      "/documents/upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return response.data;
  },

  /**
   * Get all documents uploaded by the current user.
   */
  getMyDocuments: async (params?: {
    page?: number;
    limit?: number;
    q?: string;
    subjectId?: number;
    visibilityStatus?: string;
  }): Promise<{ data: Document[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
    // Clean up undefined/empty params
    const cleanParams: any = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          cleanParams[key] = value;
        }
      });
    }
    const response = await axiosClient.get("/documents/me", { params: cleanParams });
    return response.data;
  },

  /**
   * Get a specific document by its ID.
   */
  getDocumentById: async (id: string): Promise<Document> => {
    const response = await axiosClient.get(`/documents/${id}`);
    return response.data;
  },

  /**
   * Soft delete a document by its ID.
   */
  deleteDocument: async (id: string): Promise<{ statusCode: number; message: string }> => {
    const response = await axiosClient.delete(`/documents/${id}`);
    return response.data;
  },

  /**
   * Update document metadata (title, description, subjectId).
   */
  updateDocument: async (id: string, payload: { title?: string; description?: string; subjectId?: number; tags?: string }): Promise<Document> => {
    const response = await axiosClient.patch(`/documents/${id}`, payload);
    return response.data;
  },

  /**
   * Analyze a document to generate its summary and quiz.
   */
  analyzeDocument: async (id: string): Promise<any> => {
    const response = await axiosClient.post(`/documents/analyze/${id}`);
    return response.data;
  },

  /**
   * Follow/save a document.
   */
  followDocument: async (id: string): Promise<any> => {
    const response = await axiosClient.post(`/documents/${id}/follow`);
    return response.data;
  },

  /**
   * Unfollow/unsave a document.
   */
  unfollowDocument: async (id: string): Promise<any> => {
    const response = await axiosClient.post(`/documents/${id}/unfollow`);
    return response.data;
  },

  /**
   * Get secure signed URL for inline preview.
   */
  getPreviewSignedUrl: async (id: string): Promise<SignedDocumentUrlResponse> => {
    const response = await axiosClient.get(`/documents/${id}/preview`);
    return response.data.data || response.data;
  },

  /**
   * Get secure signed URL for download attachment.
   */
  getDownloadSignedUrl: async (id: string): Promise<SignedDocumentUrlResponse> => {
    const response = await axiosClient.get(`/documents/${id}/download`);
    return response.data.data || response.data;
  },

  /**
   * Request to make a document public.
   */
  requestDocumentPublic: async (id: string): Promise<any> => {
    const response = await axiosClient.post(`/documents/${id}/request-public`);
    return response.data;
  },

  /**
   * Withdraw a public document.
   */
  withdrawDocumentPublic: async (id: string): Promise<any> => {
    const response = await axiosClient.post(`/documents/${id}/withdraw-public`);
    return response.data;
  },
};
