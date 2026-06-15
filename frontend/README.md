# ScholarHub Frontend

Dự án Frontend cho hệ thống ScholarHub (AI Study Hub), được xây dựng bằng **Next.js** (App Router), **Tailwind CSS v4**, **HeroUI**, **SWR** và **Axios**.

## 🚀 Hướng dẫn khởi chạy

Cài đặt các dependency và khởi chạy dự án ở chế độ phát triển:

```bash
# Cài đặt thư viện
npm install

# Khởi chạy dev server (mặc định cấu hình ở cổng 5000)
npm run dev
```

---

## 📁 Cấu trúc thư mục chi tiết (Directory Structure)

Thư mục nguồn được tổ chức theo tiêu chuẩn của Next.js App Router, chia rõ các lớp (layer) xử lý giao diện, logic và kết nối dữ liệu:

```text
frontend/
├── app/                            # Lớp Routing & Layout (App Router)
│   ├── (private)/                  # Nhóm các Route yêu cầu ĐĂNG NHẬP (Private Routes)
│   │   ├── admin/
│   │   │   └── page.tsx            # Bảng điều khiển Admin Dashboard
│   │   ├── explore/
│   │   │   └── page.tsx            # Trang tìm kiếm và khám phá tài liệu học tập
│   │   ├── welcome/
│   │   │   └── page.tsx            # Trang chào mừng sau khi đăng nhập thành công
│   │   └── layout.tsx              # Route Guard: Kiểm tra Token trong localStorage để bảo vệ trang
│   ├── (public)/                   # Nhóm các Route công khai (Public Routes)
│   │   └── login/
│   │       └── page.tsx            # Trang đăng nhập tài khoản
│   ├── globals.css                 # File Style toàn cục (Tailwind CSS v4 custom theme)
│   ├── layout.tsx                  # Root Layout toàn dự án (chứa Google Fonts, Icons)
│   ├── page.tsx                    # Cổng phân luồng (Chưa đăng nhập -> LandingPage, đã đăng nhập -> Dashboard)
│   └── providers.tsx               # Nơi chứa các Providers dùng chung (HeroUIProvider)
│
├── components/                     # Lớp Giao diện (UI Components)
│   ├── pages/                      # Các component lớn đại diện cho cả trang
│   │   └── admin/
│   │       └── metrics.tsx         # Component hiển thị các thẻ thống kê hệ thống
│   ├── modal/                      # Các cửa sổ Pop-up, Modal dùng chung (đang phát triển)
│   └── LandingPage.tsx             # Giao diện giới thiệu dự án (MindForge)
│
├── hooks/                          # Lớp Logic và Trạng thái (Custom Hooks)
│   ├── useAdminMetrics.ts          # Hook quản lý fetch số liệu hệ thống của Admin
│   └── useAuth.ts                  # Hook quản lý đăng nhập, đăng xuất và kiểm duyệt Email/Password
│
├── services/                       # Lớp Giao tiếp API (API Service Layer)
│   ├── adminApi.ts                 # Gọi các API thống kê số liệu của Admin
│   └── authApi.ts                  # Xử lý xác thực (kiểm tra tài khoản thực tế hoặc mock qua lib/users.ts)
│
├── lib/                            # Lớp Dữ liệu tĩnh & Cấu hình cục bộ
│   └── users.ts                    # Dữ liệu tài khoản mock để chạy thử hệ thống khi chưa bật Backend
│
├── utils/                          # Lớp Tiện ích dùng chung (Helper Utilities)
│   └── axios.ts                    # Axios Client tự động lấy Token từ localStorage để gửi kèm trong Header
```

---

## 🔒 Cơ chế phân luồng & Bảo mật (Route Guard)

Hệ thống phân chia các trang thành 2 vùng chính:

1. **Vùng Công Khai (Public Routes):**
   * `/login`: Nơi người dùng thực hiện đăng nhập.
   * `/` (khi chưa đăng nhập): Hiển thị trang giới thiệu (Landing Page).

2. **Vùng Riêng Tư (Private Routes - nằm trong thư mục `app/(private)/`):**
   * `/explore`, `/admin`, `/welcome`...
   * **Cách hoạt động:** Khi người dùng cố gắng truy cập vào bất kỳ đường dẫn nào nằm trong `app/(private)/`, file `app/(private)/layout.tsx` (Route Guard) sẽ được kích hoạt trước tiên. Nó kiểm tra xem có `token` trong `localStorage` hay không. 
     * Nếu **không có token**, người dùng ngay lập tức bị chuyển hướng về `/login`.
     * Nếu **có token**, trang web sẽ tiếp tục render nội dung bình thường.

---

## 🛠️ Công nghệ sử dụng chính

* **Framework:** Next.js (App Router)
* **Styling:** Tailwind CSS v4 (Sử dụng `@theme` directive trực tiếp trong `globals.css` để cấu hình biến màu sắc Material Design).
* **UI Library:** HeroUI (bọc bên ngoài bằng `Providers` trong `providers.tsx`).
* **Data Fetching:** SWR (dùng để tự động revalidate, cache và tải bất đồng bộ các API dữ liệu).
* **HTTP Client:** Axios (cấu hình Base URL linh hoạt và tự động đính kèm bearer token qua Axios Interceptors).
