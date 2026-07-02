# Quy chuẩn Thiết kế & Viết API - AI Study Hub

Tài liệu này quy định các quy chuẩn bắt buộc khi thiết kế, triển khai và bảo vệ API trong dự án NestJS của **AI Study Hub**.

---

## I. Giải thích các Thành phần Mở rộng trong NestJS API

Khi viết API trong NestJS, chúng ta mở rộng tính năng của các route handler thông qua các Decorator. Dưới đây là ý nghĩa và cách dùng của từng thành phần:

### 1. Guards (Bộ bảo vệ Route)
* **Khái niệm**: Guard được chạy trước khi request đi vào Controller. Nhiệm vụ chính là xác thực (Authentication) và phân quyền (Authorization).
* **Các Guard hiện có**:
  - `@UseGuards(JwtAuthGuard)`: Xác thực xem request có chứa token hợp lệ không (thường lấy từ cookie hoặc Bearer token). Nếu không hợp lệ, trả về `401 Unauthorized`.
  - `@UseGuards(OptionalJwtAuthGuard)`: Cho phép cả người dùng chưa đăng nhập truy cập, nhưng nếu đã đăng nhập thì sẽ tự động trích xuất thông tin user.
  - `@UseGuards(RolesGuard)` kết hợp với `@Roles(UserRole.ADMIN)`: Phân quyền cụ thể. Ví dụ: Chỉ Admin mới có quyền duyệt tài liệu.
  - `@UseGuards(ThrottlerGuard)`: Rate limiting để chống spam/DDoS API.

### 2. Request Validation (DTOs & Pipes)
* **DTO (Data Transfer Object)**: Là class định nghĩa cấu trúc dữ liệu gửi lên từ Client. Chúng ta sử dụng `class-validator` (như `@IsString`, `@IsNotEmpty`, `@IsEmail`) trên DTO để tự động kiểm tra định dạng dữ liệu đầu vào.
* **Pipes**: Tiền xử lý dữ liệu trước khi vào controller. Ví dụ:
  - `new ParseUUIDPipe({ version: '4' })`: Đảm bảo `:id` gửi lên bắt buộc phải là định dạng UUIDv4. Nếu sai, trả về `400 Bad Request`.
  - `new ValidateFilePipe()`: Kiểm tra dung lượng, định dạng file upload trước khi xử lý.

### 3. Swagger/OpenAPI Decorators (Tài liệu hóa API)
Dùng để tự động tạo tài liệu API tương tác (thường truy cập tại `/api/docs`).
* **`@ApiTags('tên_nhóm')`**: Gom nhóm các API lại với nhau (ví dụ: `Auth`, `Documents`).
* **`@ApiOperation({ summary: 'Mô tả ngắn' })`**: Giải thích API này dùng để làm gì.
* **`@ApiResponse({ status: 200, description: 'Thành công' })`**: Định nghĩa các kiểu dữ liệu và mã trạng thái trả về.
* **`@ApiBearerAuth()`**: Đánh dấu API yêu cầu truyền JWT token ở Header.

### 4. HTTP Response Status Codes (`@HttpCode`)
Mặc định trong NestJS:
* Yêu cầu `POST` trả về `201 Created`.
* Các yêu cầu `GET`, `PUT`, `PATCH`, `DELETE` trả về `200 OK`.
* **`@HttpCode(HttpStatus.OK)`**: Dùng để thay đổi mã trạng thái mặc định. Ví dụ: Endpoint `/auth/login` dùng phương thức `POST`, nhưng ta chỉ muốn trả về `200 OK` (vì không tạo mới tài nguyên lâu dài), ta sẽ dùng `@HttpCode(200)`. Hoặc `@HttpCode(204)` (No Content) khi thực hiện `DELETE` thành công.

---

## II. Quy định bắt buộc khi viết API mới

Mỗi khi tạo một API mới, lập trình viên **BẮT BUỘC** phải tuân thủ các quy tắc sau:

1. **Luôn sử dụng DTO để validate dữ liệu `@Body`**:
   - Tuyệt đối KHÔNG dùng kiểu dữ liệu `any` hoặc Object thô (`dto: { email: string }`) cho request body.
   - Phải tạo class DTO riêng, khai báo các decorator kiểm tra dữ liệu từ `class-validator`.

2. **Áp dụng Guard bảo vệ**:
   - Mọi API liên quan đến dữ liệu cá nhân hoặc thao tác sửa/xóa/tạo đều phải có `@UseGuards(JwtAuthGuard)`.
   - Các API quản trị phải có `@Roles(UserRole.ADMIN)` và `@UseGuards(RolesGuard)`.

3. **Ghi nhận IP và Thiết bị đối với luồng nhạy cảm**:
   - Đối với các API đăng nhập, đổi mật khẩu, hoặc refresh token, bắt buộc phải thu thập IP (`request.ip`) và Device ID (`x-device-id`) để ghi nhận log bảo mật.

4. **Định nghĩa mã lỗi rõ ràng**:
   - Sử dụng đúng các Exception của NestJS: `NotFoundException` (404), `ForbiddenException` (403), `BadRequestException` (400), `ConflictException` (409).

5. **Đồng bộ định dạng phản hồi (Unified Response)**:
   - Toàn bộ kết quả trả về từ Controller phải bọc trong Interceptor chuẩn:
     `return { statusCode: 200, message: '...', data: result };`

---

## III. Đánh giá hệ thống API hiện tại của AI Study Hub

Qua phân tích mã nguồn hiện tại, dưới đây là đánh giá chi tiết về những phần đã làm tốt, những phần còn thiếu và các điểm cần khắc phục:

### 1. Những phần đã có và hoạt động tốt (Đang có)
* **Cơ chế CORS và Cookie**: Quản lý tốt việc gửi `access_token` qua HTTP-Only Cookie chống tấn công XSS.
* **Middleware Cookie-Parser & ValidationPipe**: Đã được đăng ký toàn cục trong `main.ts` giúp tự động kiểm tra DTO.
* **UUID Validation**: Toàn bộ các API lấy tài liệu hoặc thực thể qua UUID đều đã dùng `new ParseUUIDPipe({ version: '4' })` rất an toàn.
* **Dynamic JWT Guard**: Có cơ chế `OptionalJwtAuthGuard` hỗ trợ phân tách trải nghiệm giữa khách vãng lai và thành viên đã đăng nhập.

### 2. Các điểm đang bị THIẾU hoặc LỖI (Cần khắc phục ngay)

* **Thiếu hoàn toàn Swagger Decorator**:
  - Code hiện tại ở các controller (`documents.controller.ts`, `auth.controller.ts`) **chưa sử dụng bất kỳ decorator nào của Swagger** (như `@ApiOperation`, `@ApiResponse`, `@ApiTags`). Điều này khiến tài liệu API tự động (`/api/docs`) không hiển thị thông tin hoặc hiển thị sơ sài.
  - *Giải pháp*: Cần bổ sung các decorator này vào đầu mỗi class Controller và mỗi Route Handler.

* **Sử dụng kiểu `any` nguy hiểm trong Auth API**:
  - Tại file `auth.controller.ts`:
    ```typescript
    @Post('reset-password')
    async resetPassword(@Body() body: any) { ... }
    ```
    Việc sử dụng `@Body() body: any` cho tính năng đổi mật khẩu là **cực kỳ nguy hiểm** vì kẻ tấn công có thể gửi lên bất kỳ kiểu dữ liệu nào hoặc bỏ trống trường dữ liệu gây crash hệ thống hoặc lỗi logic.
  - *Giải pháp*: Tạo `ResetPasswordDto` cụ thể với các thuộc tính `@IsString`, `@IsNotEmpty`, `@Length` và thay vào vị trí `any`.

* **Thiếu sử dụng `@HttpCode` nhất quán**:
  - API `POST /auth/login` đang trả về mã trạng thái mặc định `201 Created` thay vì `200 OK` như chuẩn thiết kế REST.
  - *Giải pháp*: Bổ sung `@HttpCode(HttpStatus.OK)` cho các API mang tính chất truy vấn hoặc hành động không tạo tài nguyên mới dài hạn (như Login, Refresh, Reset Password).
