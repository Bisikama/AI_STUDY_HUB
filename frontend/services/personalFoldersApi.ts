import axiosClient from "@/utils/axios";

export interface PersonalFolder {
  id: string;
  name: string;
  parentId: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  children?: PersonalFolder[];
}

export const personalFoldersApi = {
  getFolders: async (): Promise<PersonalFolder[]> => {
    const response = await axiosClient.get("/personal-folders");
    return response.data;
  },

  create: async (payload: { name: string; parentId?: string }): Promise<PersonalFolder> => {
    const response = await axiosClient.post("/personal-folders", payload);
    return response.data;
  },

  update: async (id: string, payload: { name?: string; parentId?: string | null }): Promise<PersonalFolder> => {
    const response = await axiosClient.patch(`/personal-folders/${id}`, payload);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/personal-folders/${id}`);
  },
};
