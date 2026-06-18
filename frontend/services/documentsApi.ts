import axiosClient from "@/utils/axios";

export interface UploadDocumentPayload {
  file: File;
  title: string;
  description?: string;
  subjectId: number;
}

export interface Document {
  id: string;
  title: string;
  description: string | null;
  subjectId: number;
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
}

export interface UploadDocumentResponse {
  statusCode: number;
  message: string;
  data: {
    id: string;
    title: string;
    description: string | null;
    subjectId: number;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    status: string;
    createdAt: string;
  };
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
  getMyDocuments: async (): Promise<{ statusCode: number; message: string; data: Document[] }> => {
    const response = await axiosClient.get("/documents/me");
    return response.data;
  },
};

