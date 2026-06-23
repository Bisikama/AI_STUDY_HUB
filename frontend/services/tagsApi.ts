import axiosClient from '../utils/axios';

export interface Tag {
  id: number;
  name: string;
  slug: string;
  isSystem: boolean;
  createdBy?: string | null;
}

interface TagsResponse {
  statusCode: number;
  message: string;
  data: Tag[];
}

interface CreateTagResponse {
  statusCode: number;
  message: string;
  data: Tag;
}

export const tagsApi = {
  getTags: async (): Promise<Tag[]> => {
    const response = await axiosClient.get<Tag[]>('/tags');
    return response.data;
  },

  createTag: async (name: string): Promise<Tag> => {
    const response = await axiosClient.post<Tag>('/tags', { name });
    return response.data;
  },
};
