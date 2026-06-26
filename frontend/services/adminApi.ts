import axiosClient from "@/utils/axios";

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
};