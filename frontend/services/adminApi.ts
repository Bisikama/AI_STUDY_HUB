import axiosClient from "@/utils/axios";

export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';

export type ReportReason =
  | 'INCORRECT_CONTENT'
  | 'WRONG_SUBJECT'
  | 'OUTDATED_SYLLABUS'
  | 'DUPLICATED_DOCUMENT'
  | 'FILE_ERROR'
  | 'LOW_QUALITY'
  | 'SPAM'
  | 'COPYRIGHT_VIOLATION'
  | 'INAPPROPRIATE_CONTENT'
  | 'OTHER';

export type DocumentModerationStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'HIDDEN' | 'REMOVED';

export interface AdminReport {
  id: string;
  documentId: string;
  reporterId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  document: {
    id: string;
    title: string;
    status: DocumentModerationStatus;
    visibilityStatus: 'PRIVATE' | 'PENDING_REVIEW' | 'PUBLIC';
    uploadedBy: string;
    user: {
      fullName: string;
      email: string;
    };
  };
  reporter: {
    id: string;
    fullName: string;
    email: string;
  };
  reviewer: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface GetReportsParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  reason?: ReportReason;
  documentId?: string;
}

export interface GetReportsResponse {
  data: AdminReport[];
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface ResolveReportPayload {
  status: ReportStatus;
  documentStatus?: DocumentModerationStatus;
  adminNote?: string;
}

export interface AdminMetrics {
  totalUsers: number;
  totalDocuments: number;
  totalStorage: number;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  username: string | null;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  _count: { documents: number };
}

export interface PendingDocument {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  status: 'PENDING' | 'APPROVED' | 'PRIVATE';
  fullText: string | null;   // nội dung text đầy đủ
  createdAt: string;
  subject: { id: number; name: string; code: string };
  user: { id: string; fullName: string; email: string };
  copyrightSourceType?: string;
  copyrightAuthorName?: string | null;
  copyrightDeclaredAt?: string | null;
  isDuplicateDetected?: boolean;
  duplicateSourceInfo?: {
    id: string;
    title: string;
    author: string;
    email: string;
    createdAt: string;
  } | null;
}

export interface AdminQuiz {
  id: string;
  documentId: string;
  createdBy: string | null;
  title: string;
  createdAt: string;
  document: {
    id: string;
    title: string;
    subject: { id: number; name: string; code: string };
  };
  user: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  _count: {
    questions: number;
  };
}

export interface GetQuizzesResponse {
  data: AdminQuiz[];
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface AdminQuizDetail {
  id: string;
  documentId: string;
  createdBy: string | null;
  title: string;
  createdAt: string;
  document: {
    id: string;
    title: string;
  };
  questions: Array<{
    id: string;
    quizId: string;
    questionText: string;
    createdAt: string;
    options: Array<{
      id: string;
      questionId: string;
      optionText: string;
      isCorrect: boolean;
      createdAt: string;
    }>;
  }>;
}

export interface QuizAnalytics {
  quizId: string;
  quizTitle: string;
  documentTitle: string;
  totalAttempts: number;
  averageScore: number;
}

export const adminApi = {
  /** GET /api/admin/metrics */
  getMetrics: async (): Promise<AdminMetrics> => {
    const response = await axiosClient.get("/admin/metrics");
    return response.data;
  },

  /** GET /api/admin/users */
  getAllUsers: async (): Promise<AdminUser[]> => {
    const response = await axiosClient.get("/admin/users");
    return response.data;
  },

  /** GET /api/admin/documents/pending */
  getPendingDocuments: async (): Promise<PendingDocument[]> => {
    const response = await axiosClient.get("/admin/documents/pending");
    return response.data;
  },

  /** PATCH /api/admin/documents/:id/approve */
  approveDocument: async (id: string): Promise<void> => {
    await axiosClient.patch(`/admin/documents/${id}/approve`, { status: "APPROVED" });
  },

  /** PATCH /api/admin/documents/:id/approve  — reject maps to PRIVATE in BE */
  rejectDocument: async (id: string): Promise<void> => {
    await axiosClient.patch(`/admin/documents/${id}/approve`, { status: "REJECTED" });
  },

  /** DELETE /api/admin/documents/:id */
  deleteDocument: async (id: string): Promise<void> => {
    await axiosClient.delete(`/admin/documents/${id}`);
  },

  /** GET /api/admin/quizzes */
  getQuizzes: async (params: { page?: number; limit?: number; search?: string; subjectId?: number }): Promise<GetQuizzesResponse> => {
    const response = await axiosClient.get("/admin/quizzes", { params });
    return response.data;
  },

  /** GET /api/admin/quizzes/:id */
  getQuizById: async (id: string): Promise<AdminQuizDetail> => {
    const response = await axiosClient.get(`/admin/quizzes/${id}`);
    return response.data;
  },

  /** PATCH /api/admin/quizzes/questions/:questionId */
  updateQuizQuestion: async (questionId: string, payload: { questionText?: string; options?: Array<{ id: string; optionText: string; isCorrect: boolean }> }): Promise<any> => {
    const response = await axiosClient.patch(`/admin/quizzes/questions/${questionId}`, payload);
    return response.data;
  },

  /** DELETE /api/admin/quizzes/:id */
  deleteQuiz: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.delete(`/admin/quizzes/${id}`);
    return response.data;
  },

  /** GET /api/admin/quizzes/:id/analytics */
  getQuizAnalytics: async (id: string): Promise<QuizAnalytics> => {
    const response = await axiosClient.get(`/admin/quizzes/${id}/analytics`);
    return response.data;
  },
  
  /** GET /api/admin/reports */
  getReports: async (params?: GetReportsParams): Promise<GetReportsResponse> => {
    const response = await axiosClient.get("/admin/reports", { params });
    return response.data;
  },

  /** GET /api/admin/reports/:reportId */
  getReportDetails: async (reportId: string): Promise<AdminReport> => {
    const response = await axiosClient.get(`/admin/reports/${reportId}`);
    return response.data;
  },

  /** PATCH /api/admin/reports/:reportId */
  resolveReport: async (reportId: string, payload: ResolveReportPayload): Promise<AdminReport> => {
    const response = await axiosClient.patch(`/admin/reports/${reportId}`, payload);
    return response.data;
  },
};