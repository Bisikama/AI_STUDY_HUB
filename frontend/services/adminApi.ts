import axiosClient from "@/utils/axios";

export const adminApi = {
  getMetrics: async () => {
    try {
      const response = await axiosClient.get("/admin/metrics");
      return response.data;
    } catch (error) {
      console.error("Error fetching metrics:", error);
      throw error;
    }
  }
}