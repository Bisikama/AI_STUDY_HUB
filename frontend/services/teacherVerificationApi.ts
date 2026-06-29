import axiosClient from "@/utils/axios";

export interface TeacherVerificationData {
  id: string;
  userId: string;
  teacherCode: string;
  department: string | null;
  proofUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
  };
}

export const teacherVerificationApi = {
  submit: async (payload: { teacherCode: string; department?: string; proofUrl?: string }) => {
    const response = await axiosClient.post("/teacher-verification", payload);
    return response.data;
  },

  getMyStatus: async (): Promise<TeacherVerificationData | null> => {
    const response = await axiosClient.get("/teacher-verification/me");
    return response.data;
  },

  getAdminList: async (): Promise<TeacherVerificationData[]> => {
    const response = await axiosClient.get("/teacher-verification/admin/list");
    return response.data;
  },

  reviewRequest: async (id: string, payload: { status: "APPROVED" | "REJECTED"; adminNote?: string }) => {
    const response = await axiosClient.patch(`/teacher-verification/admin/${id}/status`, payload);
    return response.data;
  },
};
