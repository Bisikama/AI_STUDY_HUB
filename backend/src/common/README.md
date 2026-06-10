# Tài liệu về thư mục Common (Common Components Documentation)

Thư mục `common` chứa các thành phần dùng chung cho toàn bộ ứng dụng Backend (NestJS), bao gồm các bộ lọc lỗi (filters), bộ đánh chặn phản hồi (interceptors) và các giao diện dữ liệu (interfaces). Việc tổ chức các thành phần này giúp chuẩn hóa dữ liệu đầu ra (API Response) và đồng bộ cách xử lý lỗi hệ thống.

---

## Cấu trúc thư mục `common`

```text
backend/src/common/
├── filters/
│   ├── httpException.filter.ts
│   └── index.ts
├── guards/           # Hiện tại trống (Dành cho việc bảo vệ router/phân quyền)
├── interceptors/
│   ├── apiResponse.interceptor.ts
│   ├── apiResponsePayload.ts
│   └── index.ts
├── interfaces/
│   └── apiResponse.interface.ts
└── pipes/            # Hiện tại trống (Dành cho việc validate/transform dữ liệu)
```

---

## Chi tiết các thành phần

### 1. Interfaces (Giao diện dữ liệu)

#### 📄 [apiResponse.interface.ts](file:///d:/SESSION_7/SDN302/AI_STUDY/ai-study-hub/backend/src/common/interfaces/apiResponse.interface.ts)

*   **Tác dụng**: Định nghĩa kiểu cấu trúc chuẩn (TypeScript Interface) cho mọi phản hồi từ API của hệ thống.
*   **Chi tiết thuộc tính**:
    *   `statusCode` (`number`): Mã trạng thái HTTP (Ví dụ: `200`, `201`, `400`, `500`).
    *   `message` (`string`): Thông điệp mô tả kết quả xử lý (Ví dụ: `'Request successful'`, hoặc chi tiết lỗi).
    *   `data` (`TData`): Dữ liệu phản hồi thực tế. Sử dụng Generic Type `TData` để linh hoạt khớp với bất kỳ kiểu dữ liệu nào được trả về từ Controller.
    *   `metadata` (`TMetadata` - optional): Dữ liệu phụ trợ kèm theo (như thông tin phân trang: page, limit, total pages...).
    *   `error` (`string` - optional): Chuỗi mô tả lỗi chi tiết khi có exception xảy ra.

---

### 2. Interceptors (Bộ đánh chặn phản hồi)

#### 📄 [apiResponse.interceptor.ts](file:///d:/SESSION_7/SDN302/AI_STUDY/ai-study-hub/backend/src/common/interceptors/apiResponse.interceptor.ts)

*   **Tác dụng**: Tự động chặn và bọc dữ liệu trả về từ tất cả các Controller thành cấu trúc chuẩn `ApiResponse`. Giúp lập trình viên ở Controller chỉ cần return dữ liệu thô (hoặc DTO), không cần viết thủ công phần vỏ bọc response.
*   **Cách thức hoạt động**:
    1.  Interceptor sử dụng RxJS `map` để can thiệp vào luồng dữ liệu trả về (`next.handle()`).
    2.  Nó thực hiện kiểm tra 6 trường hợp loại trừ/đặc biệt để tránh can thiệp sai cấu trúc:
        *   **Trường hợp 1**: Nếu header đã được gửi đi (`response.headersSent`), giữ nguyên dữ liệu gốc (tránh xung đột khi controller tự handle response gửi đi trực tiếp).
        *   **Trường hợp 2**: Nếu dữ liệu là kiểu stream (`StreamableFile`) hoặc dạng nhị phân (`Buffer`), giữ nguyên (cho phép tải file, stream nhạc/video...).
        *   **Trường hợp 3**: Nếu header `content-type` được chỉ định rõ ràng không phải JSON (như HTML, plain text), giữ nguyên.
        *   **Trường hợp 4**: Nếu dữ liệu trả về đã đúng cấu trúc `ApiResponse` từ trước (kiểm tra qua phương thức `isApiResponse`), giữ nguyên.
        *   **Trường hợp 5**: Nếu dữ liệu là thực thể của class `ApiResponsePayload` (dữ liệu trả về có kèm theo metadata thông qua helper `withMetadata`), interceptor sẽ bóc tách `data` và `metadata` để build ra cấu trúc JSON chuẩn có thuộc tính `metadata`.
        *   **Trường hợp 6**: Với các kiểu dữ liệu bình thường khác, tự động bọc lại dưới dạng:
            ```json
            {
              "statusCode": response.statusCode,
              "message": "Request successful" (hoặc "Request completed"),
              "data": <dữ liệu gốc>
            }
            ```

#### 📄 [apiResponsePayload.ts](file:///d:/SESSION_7/SDN302/AI_STUDY/ai-study-hub/backend/src/common/interceptors/apiResponsePayload.ts)

*   **Tác dụng**: Cung cấp một lớp (Class) và một hàm trợ giúp (`withMetadata`) để Controller dễ dàng đính kèm thêm dữ liệu phụ trợ (`metadata`) vào response.
*   **Cách thức hoạt động**:
    *   Lớp `ApiResponsePayload` nhận vào `data` và `metadata` tương ứng.
    *   Hàm `withMetadata(data, metadata)` là một helper function giúp viết code ngắn gọn hơn.
    *   **Ví dụ sử dụng tại Controller**:
        ```typescript
        @Get()
        findAll() {
          const items = [...];
          const pagination = { page: 1, limit: 10, total: 100 };
          return withMetadata(items, pagination);
        }
        ```
        Bộ chặn `ApiResponseInterceptor` sau đó sẽ phát hiện kiểu dữ liệu trả về thuộc `ApiResponsePayload` và chuyển đổi thành:
        ```json
        {
          "statusCode": 200,
          "message": "Request successful",
          "data": [ ... ],
          "metadata": { "page": 1, "limit": 10, "total": 100 }
        }
        ```

#### 📄 [index.ts (Interceptors)](file:///d:/SESSION_7/SDN302/AI_STUDY/ai-study-hub/backend/src/common/interceptors/index.ts)

*   **Tác dụng**: Làm cổng xuất (barrel export) để gom nhóm việc export các file trong thư mục `interceptors`. Giúp viết câu lệnh import từ ngoài ngắn gọn hơn:
    ```typescript
    import { ApiResponseInterceptor, withMetadata } from '../common/interceptors';
    ```

---

### 3. Filters (Bộ lọc lỗi Exception)

#### 📄 [httpException.filter.ts](file:///d:/SESSION_7/SDN302/AI_STUDY/ai-study-hub/backend/src/common/filters/httpException.filter.ts)

*   **Tác dụng**: Bộ lọc lỗi toàn cục (Global Exception Filter) giúp bắt lấy mọi lỗi xảy ra trong quá trình xử lý request và trả về cho client một cấu trúc JSON lỗi thống nhất, đồng thời tránh việc lộ thông tin nhạy cảm của hệ thống khi có lỗi không mong muốn (500 Internal Server Error).
*   **Cách thức hoạt động**:
    1.  Sử dụng decorator `@Catch()` không truyền tham số để bắt tất cả các loại exception phát sinh (kể cả lỗi của NestJS như `NotFoundException`, `BadRequestException` lẫn lỗi runtime do code sai hoặc lỗi kết nối DB).
    2.  **Xử lý Mã trạng thái (Status Code)**:
        *   Nếu là instance của `HttpException`, lấy mã status được cấu hình của exception đó.
        *   Nếu là lỗi hệ thống thông thường (runtime error), gán mặc định là `500` (Internal Server Error).
    3.  **Xử lý Thông điệp lỗi (Message & Error Detail)**:
        *   Nếu response của exception là chuỗi (`string`), dùng chuỗi đó làm `message`.
        *   Nếu response của exception là đối tượng (`object` - như lỗi trả về khi validate DTO bằng `class-validator`), filter sẽ tìm thuộc tính `message` của đối tượng đó. Nếu là một mảng các lỗi validate, nó sẽ nối lại bằng dấu phẩy `, ` để Client dễ hiển thị. Đồng thời gán `errorDetail` từ thuộc tính `.error` của exception.
        *   Nếu exception là thực thể `Error` thuần túy của Javascript, gán `message` bằng `exception.message` và `errorDetail` bằng tên của loại lỗi `exception.name`.
    4.  **Log lỗi hệ thống**: Nếu lỗi thuộc mã `500` (lỗi hệ thống chưa được handle trước đó), filter sẽ thực hiện log chi tiết lỗi ra console bằng `console.error` để lập trình viên dễ dàng tìm nguyên nhân trên server, nhưng chỉ trả về thông điệp chung chung `"Internal server error"` cho client để bảo mật hệ thống.
    5.  **Trả về phản hồi JSON chuẩn**:
        ```json
        {
          "statusCode": <mã HTTP status>,
          "message": "<thông báo lỗi thân thiện>",
          "data": null,
          "error": "<tên loại lỗi/chi tiết lỗi>"
        }
        ```

#### 📄 [index.ts (Filters)](file:///d:/SESSION_7/SDN302/AI_STUDY/ai-study-hub/backend/src/common/filters/index.ts)

*   **Tác dụng**: Làm cổng xuất (barrel export) cho các bộ lọc lỗi. Giúp import dễ dàng hơn:
    ```typescript
    import { HttpExceptionFilter } from '../common/filters';
    ```
