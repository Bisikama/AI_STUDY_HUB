import axiosClient from "@/utils/axios";

export interface Subject {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isSystem: boolean;
  createdBy: string | null;
  createdAt: string;
}

export const subjectsApi = {
  /**
   * Get subjects visible to the current user (system + personal).
   */
  getSubjects: async (): Promise<{ statusCode: number; message: string; data: Subject[] }> => {
    const response = await axiosClient.get("/subjects");
    return response.data;
  },

  /**
   * Create a new personal subject for the current user.
   */
  createSubject: async (payload: { name: string; description?: string }): Promise<{ statusCode: number; message: string; data: Subject }> => {
    const response = await axiosClient.post("/subjects", payload);
    return response.data;
  },
};
