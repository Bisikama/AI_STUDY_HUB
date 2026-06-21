import axiosClient from '../utils/axios';

export interface Subject {
  id: number;
  name: string;
  code: string;
}

export interface ExploreDocument {
  id: string;
  title: string;
  description: string | null;
  subject: Subject | null;
  fileUrl: string;
  previewUrl: string | null;
  fileType: string;
  fileSize: string;
  downloadCount: number;
  viewCount: number;
  rating: number;
  quizCount: number;
  hasSummary: boolean;
  createdAt: string;
}

export interface Contributor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  uploadedCount: number;
}

export interface DashboardData {
  recentlyViewed: ExploreDocument[];
  publicDocuments: ExploreDocument[];
  trending: ExploreDocument[];
  topContributors: Contributor[];
}

export const dashboardApi = {
  getDashboardData: async (): Promise<DashboardData> => {
    const response = await axiosClient.get('/dashboard');
    return response.data.data;
  },

  recordView: async (documentId: string): Promise<void> => {
    await axiosClient.post(`/documents/${documentId}/view`);
  },
};
