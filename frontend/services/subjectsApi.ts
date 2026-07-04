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

export interface Major {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface CatalogItem extends Subject {
  majors: { major: Major }[];
}

export const subjectsApi = {
  /**
   * Get subjects visible to the current user (system + personal).
   */
  getSubjects: async (): Promise<Subject[]> => {
    const response = await axiosClient.get("/subjects");
    return response.data;
  },

  /**
   * Create a new personal subject for the current user.
   */
  createSubject: async (payload: { name: string; description?: string }): Promise<Subject> => {
    const response = await axiosClient.post("/subjects", payload);
    return response.data;
  },

  getMajors: async (): Promise<Major[]> => {
    const response = await axiosClient.get("/subjects/catalog/majors");
    return response.data;
  },

  getCatalog: async (majorCode?: string): Promise<CatalogItem[]> => {
    const url = majorCode ? `/subjects/catalog/courses?majorCode=${majorCode}` : `/subjects/catalog/courses`;
    const response = await axiosClient.get(url);
    return response.data;
  },
};
