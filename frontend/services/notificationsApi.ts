import axiosClient from "@/utils/axios";

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getNotifications: async (): Promise<SystemNotification[]> => {
    const res = await axiosClient.get("/notifications");
    return res.data || [];
  },

  markAsRead: async (id: string): Promise<SystemNotification> => {
    const res = await axiosClient.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await axiosClient.patch("/notifications/read-all");
  },
};
