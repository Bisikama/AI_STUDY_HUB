import axiosClient from "@/utils/axios";

export interface UploadDocumentPayload {
  file: File;
  title: string;
  description?: string;
  subjectId: number;
  tags?: string; // JSON string
}

export interface Document {
  id: string;
  title: string;
  description: string | null;
  subjectId: number;
  subject?: { id: number; name: string; code: string; isSystem: boolean } | null;
  uploadedBy: string;
  fileUrl: string;
  previewUrl: string | null;
  fileSize: number;
  fileType: string;
  downloadCount: number;
  viewCount: number;
  status: 'PRIVATE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  fullText: string | null;
  isAIGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: Array<{ documentId: string; tagId: number; tag: { id: number; name: string; slug: string; isSystem: boolean } }>;
}

export interface UploadDocumentResponse {
  id: string;
  title: string;
  description: string | null;
  subjectId: number;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  status: string;
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
  getMyDocuments: async (): Promise<Document[]> => {
    const response = await axiosClient.get("/documents/me");
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
};
