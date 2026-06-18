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
  getTags: async (): Promise<TagsResponse> => {
    const response = await axiosClient.get<TagsResponse>('/tags');
    return response.data;
  },

  createTag: async (name: string): Promise<CreateTagResponse> => {
    const response = await axiosClient.post<CreateTagResponse>('/tags', { name });
    return response.data;
  },
};
