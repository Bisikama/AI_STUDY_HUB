# BÁO CÁO ĐÓNG GÓP CÁ NHÂN (CONTRIBUTION REPORT)
**Dự án**: AI STUDY HUB  
**Thành viên thực hiện**: thu0411 (thunee0411@gmail.com)  
**Vai trò**: Full-stack Developer  

---

## I. TỔNG HỢP CÁC CHỨC NĂNG ĐÃ TRIỂN KHAI

### 1. Chức năng Xác thực người dùng bằng HttpOnly Cookie (Bảo mật cao)
* **Mô tả**: Nâng cấp cơ chế lưu trữ token từ LocalStorage sang Cookie bảo mật (`HttpOnly` và `Secure`) để chống lại các cuộc tấn công đánh cắp phiên đăng nhập (XSS).
* **Chi tiết công việc**:
  * **Frontend**: Cập nhật logic xử lý Axios interceptors để tự động đính kèm cookie trong các yêu cầu gửi lên máy xuất.
  * **Backend**: Cấu hình máy chủ để thiết lập cookie trả về trình duyệt sau khi đăng nhập thành công; thêm bước kiểm tra trạng thái tài khoản (`banned`/`active`) từ Database trước khi cấp quyền truy cập.

### 2. Chức năng Gửi OTP qua Email để khôi phục mật khẩu (Reset Password)
* **Mô tả**: Cho phép người dùng yêu cầu mã OTP gửi về email cá nhân để xác minh danh tính và đặt lại mật khẩu mới khi bị quên.
* **Chi tiết công việc**:
  * **Frontend**: Thiết kế màn hình nhập email yêu cầu OTP, màn hình nhập mã xác thực và màn hình đặt lại mật khẩu mới; sửa lỗi phân tích mã OTP ở môi trường thử nghiệm.
  * **Backend**: Cấu hình máy chủ SMTP thông qua dịch vụ **Brevo** và thư viện **Nodemailer** (Gmail) để tự động hóa gửi email chứa mã OTP; thiết lập API kiểm tra tính hợp lệ và thời hạn của OTP.

### 3. Chức năng Phân quyền Admin (Role-Based Access Control) cho Admin Dashboard
* **Mô tả**: Đảm bảo chỉ những tài khoản có vai trò Quản trị viên (`ADMIN`) mới được phép truy cập trang quản trị và thực hiện các chức năng nhạy cảm.
* **Chi tiết công việc**:
  * **Frontend**: Xây dựng Middleware chặn và chuyển hướng người dùng thường về trang chủ nếu cố tình truy cập vào các đường dẫn dạng `/admin/*`.
  * **Backend**: Xây dựng các bộ lọc quyền (Guards) kiểm tra vai trò người dùng trong cơ sở dữ liệu đối với mọi API quản trị.

### 4. Chức năng Gửi yêu cầu xác minh danh tính Giảng viên
* **Mô tả**: Cung cấp biểu mẫu cho người dùng gửi hồ sơ cá nhân để quản trị viên phê duyệt nâng cấp tài khoản từ Sinh viên lên Giảng viên.
* **Chi tiết công việc**:
  * **Frontend**: Phát triển giao diện `TeacherVerificationModal` thu thập thông tin Mã giảng viên, Khoa/Bộ môn và liên kết minh chứng (Ảnh thẻ/Quyết định công tác).
  * **Backend**: Tạo schema và migration trong Prisma để lưu trữ đơn xác minh; xây dựng API phê duyệt tự động với các tài khoản hợp lệ.

### 5. Chức năng Kỷ luật, tước quyền và cấm Giảng viên vi phạm quy chế
* **Mô tả**: Thiết lập cơ chế tự động xử lý kỷ luật khi giảng viên đăng tải các tài liệu vi phạm quy định hoặc bị báo cáo độc hại.
* **Chi tiết công việc**:
  * **Frontend**: Tích hợp hộp thoại cam kết điều khoản bắt buộc giảng viên phải xác nhận trước khi gửi đơn. Xây dựng nút chức năng cho Admin chủ động hạ quyền hoặc khóa tài khoản giảng viên vi phạm.
  * **Backend**: Sử dụng cơ chế Transaction (`Prisma $transaction`) để tự động chuyển vai trò người dùng từ `TEACHER` về `STUDENT`, bật cờ `isTeacherBanned = true` (chặn nâng quyền vĩnh viễn), và chuyển toàn bộ đơn xác minh liên quan về trạng thái từ chối (`REJECTED`) khi tài liệu của họ bị Admin ẩn/xóa.

### 6. Thiết kế và cải thiện giao diện trang Landing Page & Navbar điều hướng
* **Mô tả**: Làm mới giao diện giới thiệu ứng dụng và thanh công cụ điều hướng giúp tăng tính trực quan.
* **Chi tiết công việc**:
  * **Frontend**: Thiết kế lại toàn bộ UI trang Landing Page; xây dựng thanh điều hướng động (Navbar) tự động hiển thị các tùy chọn chức năng tùy thuộc vào vai trò người dùng đã đăng nhập.

### 7. Chức năng Hiển thị banner cảnh báo tài liệu bị khóa cho tác giả
* **Mô tả**: Giúp người dùng ngay lập tức biết được tình trạng tài liệu của mình nếu bị ban quản trị ẩn hoặc gỡ bỏ.
* **Chi tiết công việc**:
  * **Frontend**: Phát triển Banner cảnh báo động hiển thị trên giao diện chi tiết tài liệu hoặc trang cá nhân của tác giả khi tài liệu đó chuyển sang trạng thái ẩn (`HIDDEN`/`REMOVED`).

### 8. Chức năng Lọc dữ liệu rác trên Dashboard cá nhân
* **Mô tả**: Đảm bảo hiển thị dữ liệu chính xác và sạch sẽ trên Dashboard của người dùng.
* **Chi tiết công việc**:
  * **Frontend & Backend**: Triển khai logic lọc bỏ các tài liệu đã bị xóa mềm (`soft-deleted`) hoặc bị ẩn khỏi mục các tài liệu đã xem gần đây (`Recently Viewed`).

### 9. Chức năng Nâng cấp thông báo hệ thống sang Sonner Toast
* **Mô tả**: Thay thế các hộp thông báo mặc định thô sơ của trình duyệt bằng hệ thống thông báo Toast hiện đại, mượt mà.
* **Chi tiết công việc**:
  * **Frontend**: Tích hợp thư viện `Sonner`, tùy biến giao diện hiển thị các cảnh báo thành công, lỗi hoặc thông tin chung khi thực hiện đăng nhập, đăng xuất, upload tài liệu.

---

## II. DANH SÁCH CHI TIẾT LỊCH SỬ COMMITS (GIT LOGS)

| Mã Commit | Ngày thực hiện | Nội dung chi tiết công việc |
| :--- | :--- | :--- |
| `e6519f3` | 2026-07-08 | feat(avatar): Thêm viền phân biệt role Teacher/Admin trên avatar và ẩn tùy chọn xác minh không cần thiết. |
| `8d72cec` | 2026-07-08 | chore: Khởi tạo mẫu biến môi trường cấu hình `.env.example` cho backend. |
| `7e2dddb` | 2026-07-08 | feat(auth): Triển khai gửi OTP reset password qua Gmail Nodemailer. |
| `2937997` | 2026-07-08 | feat(dashboard): Lọc các tài liệu đã bị ẩn/xóa khỏi mục tài liệu xem gần đây. |
| `f62de97` | 2026-07-08 | feat(document): Hiển thị banner cảnh báo cho chủ sở hữu nếu tài liệu bị ẩn/xóa. |
| `0b8e2df` | 2026-07-08 | fix(admin): Truy vấn thêm trường `role` trong API `getReports` phục vụ kiểm tra ở FE. |
| `8f3d7a8` | 2026-07-08 | feat(teacher): Tải ảnh minh chứng trực tiếp (local upload) trong modal đăng ký giảng viên. |
| `e467203` | 2026-07-08 | feat(teacher): Thiết kế modal cam kết điều khoản, tính năng khóa/hạ cấp giảng viên vi phạm. |
| `e331b25` | 2026-07-02 | feat: Thay thế alert hệ thống bằng `sonner` toast, cập nhật nút "Đăng xuất" thành "Log out". |
| `d07d7a2` | 2026-06-30 | chore: Tạo Prisma migration cho luồng xác minh giảng viên và đánh giá. |
| `4c93808` | 2026-06-29 | feat: Tích hợp email xác thực Supabase & cơ chế tự động duyệt giảng viên. |
| `9d25d92` | 2026-06-24 | fix(auth): Sửa lỗi parse devOtp ở frontend và giới hạn trả về devOtp khi lỗi gửi thư. |
| `851b8d7` | 2026-06-23 | feat: Cấu hình SMTP gửi mail qua Brevo. |
| `4096ba4` | 2026-06-22 | feat: Áp dụng bắt buộc cookie-only, check user status khi login và chuyển CORS sang config. |
| `cfe650a` | 2026-06-22 | feat: Chuyển đổi cơ chế xác thực sang HttpOnly Cookie và thêm bước check user status DB. |
| `81f6ac4` | 2026-06-22 | feat(landing): Cập nhật giao diện Landing page và các tùy chọn Navbar. |
| `1212dc4` | 2026-06-22 | fix(auth): Giải quyết lỗi phân tích login payload và ép kiểu port SMTP. |
| `351538c` | 2026-06-18 | fix: Sửa lỗi biên dịch TypeScript và phạm vi biến trên các trang auth. |
| `35b2b3f` | 2026-06-18 | feat: Triển khai gửi OTP qua Gmail, đặt lại mật khẩu và API lấy thông tin profile cá nhân. |
| `88ab183` | 2026-06-18 | feat: Sửa các lỗi liên quan đến Authentication. |
| `6b586ba` | 2026-06-10 | feat: Cập nhật module xác thực. |
| `e3bb260` | 2026-06-08 | feat: Triển khai phân quyền (Role-based access control) trên trang quản trị Admin. |
