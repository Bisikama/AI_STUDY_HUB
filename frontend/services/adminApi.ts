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

export const adminApi = {
  /** GET /api/admin/metrics */
  getMetrics: async (): Promise<AdminMetrics> => {
    const response = await axiosClient.get("/admin/metrics");
    return response.data.data;
  },

  /** GET /api/admin/users */
  getAllUsers: async (): Promise<AdminUser[]> => {
    const response = await axiosClient.get("/admin/users");
    return response.data.data;
  },

  /** GET /api/admin/documents/pending */
  getPendingDocuments: async (): Promise<PendingDocument[]> => {
    const response = await axiosClient.get("/admin/documents/pending");
    return response.data.data;
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
};