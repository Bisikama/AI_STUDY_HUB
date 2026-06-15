# Hướng Dẫn Thiết Lập Cơ Sở Dữ Liệu Local Bằng Docker

Tài liệu này hướng dẫn cách khởi dựng cơ sở dữ liệu PostgreSQL cục bộ bằng Docker để phát triển code độc lập, tránh ảnh hưởng đến cơ sở dữ liệu chung trên Supabase.

---

## 📌 Điều kiện tiên quyết (Prerequisites)
Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
1. **Docker Desktop**: Tải và cài đặt tại [trang chủ Docker](https://www.docker.com/products/docker-desktop/). *(Đảm bảo Docker Desktop đang chạy trước khi thực hiện các bước tiếp theo).*
2. **Node.js & npm**: (Phiên bản tương thích với dự án).

---

## 🚀 Các bước cài đặt nhanh (Quick Setup)

### Bước 1: Khởi động PostgreSQL Container
Mở Terminal tại thư mục `backend/` chứa file `docker-compose.yml` và chạy lệnh sau để kéo (pull) và chạy database ngầm:
```bash
docker compose up -d
```
> **Giải thích**: Database được cấu hình chạy trên cổng **`5433`** của máy bạn (để tránh xung đột nếu máy bạn đã cài sẵn dịch vụ PostgreSQL gốc chạy trên cổng `5432`).

---

### Bước 2: Cấu hình biến môi trường (`.env`)
Mở hoặc tạo file `.env` tại thư mục `backend/` và thêm các biến cấu hình để Docker đọc mật khẩu/cổng, đồng thời trỏ các biến kết nối database thành địa chỉ database local:

```env
# Khai báo thông tin database cho Docker Compose đọc
DB_USER=postgres
DB_PASSWORD=localpassword123
DB_NAME=ai_study_hub_local
DB_LOCAL_PORT=5433

# Cấu hình chuỗi kết nối local cho Prisma/NestJS
DATABASE_URL="postgresql://postgres:localpassword123@localhost:5433/ai_study_hub_local?schema=public"
DIRECT_URL="postgresql://postgres:localpassword123@localhost:5433/ai_study_hub_local?schema=public"
DIRECT_CONNECTION_URL="postgresql://postgres:localpassword123@localhost:5433/ai_study_hub_local?schema=public"
```

---

### Bước 3: Đồng bộ cấu trúc bảng (Database Migrations)
Chạy lệnh sau để Prisma tự động quét và khởi tạo cấu trúc bảng trên CSDL Local khớp 100% với schema dự án:
```bash
npx prisma migrate dev
```

---

### Bước 4: Tạo dữ liệu mẫu (Seeding)
Sau khi bảng được tạo thành công, chạy lệnh dưới đây để đổ dữ liệu thử nghiệm (tài khoản test, môn học, tài liệu mẫu, câu hỏi trắc nghiệm...) vào CSDL local:
```bash
npm run db:seed
```

---

### Bước 5: Chạy thử ứng dụng Backend
Sau khi hoàn tất, bạn có thể khởi động ứng dụng NestJS ở chế độ phát triển:
```bash
npm run start:dev
```

---

## 📊 Kết nối cơ sở dữ liệu qua pgAdmin 4
Nếu muốn trực quan hóa dữ liệu qua pgAdmin 4, bạn đăng ký một Server mới với thông tin sau:

* **Host name/address**: `localhost` hoặc `127.0.0.1`
* **Port**: `5433` (⚠️ *Lưu ý điền đúng cổng 5433*)
* **Maintenance database**: `postgres` hoặc `ai_study_hub_local`
* **Username**: `postgres`
* **Password**: `localpassword123`
* *(Tích chọn **Save password** để lưu lại)*

---

## 🛠️ Một số lệnh Docker hữu ích

* **Kiểm tra trạng thái container đang chạy**:
  ```bash
  docker compose ps
  ```
* **Dừng database (vẫn lưu lại dữ liệu)**:
  ```bash
  docker compose stop
  ```
* **Khởi động lại database đã dừng**:
  ```bash
  docker compose start
  ```
* **Xóa container (Giải phóng bộ nhớ và xóa data)**:
  ```bash
  docker compose down -v
  ```
