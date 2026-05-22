import axiosClient from "@/utils/axios";
import { users } from "@/lib/users"; // Import file data fake của mày để giả lập

export const authApi = {
  // 1. Hàm xử lý Đăng nhập
  login: async (credentials: any) => {
    // --- ĐOẠN NÀY LÀ FAKE ĐỂ TEST ---
    // Giả lập trễ mạng 1 giây cho giống thật
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users.find(
          (u) => u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
          // Trả về cấu trúc giống hệt API thật sẽ trả về sau này
          resolve({
            data: {
              user: { id: user.id, email: user.email, name: user.name },
              token: "fake-jwt-token-abcd",
            },
          });
        } else {
          reject({ response: { data: { message: "Sai tài khoản hoặc mật khẩu!" } } });
        }
      }, 1000);
    });

    /* --- ĐOẠN NÀY LÀ DÀNH CHO DỰ ÁN THẬT ---
    Khi có Backend, mày chỉ cần xóa đống code bên trên và dùng đúng 1 dòng này:
    return axiosClient.post("/auth/login", credentials);
    */
  },

  // 2. Ví dụ hàm lấy thông tin user hiện tại
  getProfile: () => {
    return axiosClient.get("/auth/profile");
  },

  checkEmail: async (email: string) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users.find((u) => u.email === email);
        if (user) {
          resolve({ data: { exists: true } });
        } else {
          reject({ response: { data: { message: "Email không tồn tại!" } } });
        }
      }, 800); // Giả lập trễ mạng ngắn hơn login một chút
    });
  },
  
  checkPassword: async (email: string, password: string) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users.find((u) => u.email === email && u.password === password);
        if (user) {
          resolve({ data: { valid: true } });
        } else {
          reject({ response: { data: { message: "Mật khẩu không đúng!" } } });
        }
      }, 800);
    });
  }
};