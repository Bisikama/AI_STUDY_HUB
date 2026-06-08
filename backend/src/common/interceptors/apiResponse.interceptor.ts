import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/apiResponse.interface';
import { ApiResponsePayload } from './apiResponsePayload';

@Injectable()
export class ApiResponseInterceptor<TData, TMetadata = unknown>
  implements NestInterceptor<TData, ApiResponse<TData, TMetadata> | unknown> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<TData>,
  ): Observable<ApiResponse<TData, TMetadata> | unknown> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        // 1. Kiểm tra nếu Response headers đã được gửi đi (tránh can thiệp khi controller tự xử lý res)
        if (response.headersSent) {
          return data;
        }

        // 2. Không can thiệp nếu dữ liệu trả về là Stream (StreamableFile) hoặc Buffer nhị phân
        if (data instanceof StreamableFile || Buffer.isBuffer(data)) {
          return data;
        }

        // 3. Không can thiệp nếu Content-Type được định nghĩa cụ thể không phải JSON
        const contentType = response.getHeader('content-type');
        if (contentType && !contentType.toString().includes('application/json')) {
          return data;
        }

        // 4. Nếu đã đúng định dạng ApiResponse rồi thì giữ nguyên
        if (this.isApiResponse(data)) {
          return data;
        }

        // 5. Xử lý trường hợp sử dụng `withMetadata` (ApiResponsePayload)
        if (data instanceof ApiResponsePayload) {
          return {
            statusCode: response.statusCode,
            message: this.getDefaultMessage(response.statusCode),
            data: data.data,
            metadata: data.metadata,
          };
        }

        // 6. Mặc định bọc lại dữ liệu thông thường
        return {
          statusCode: response.statusCode,
          message: this.getDefaultMessage(response.statusCode),
          data,
        };
      }),
    );
  }

  private isApiResponse(value: unknown): value is ApiResponse<TData, TMetadata> {
    if (value === null || typeof value !== 'object') {
      return false;
    }

    const maybeResponse = value as Partial<ApiResponse<TData, TMetadata>>;

    return (
      typeof maybeResponse.statusCode === 'number' &&
      typeof maybeResponse.message === 'string' &&
      Object.prototype.hasOwnProperty.call(maybeResponse, 'data')
    );
  }

  private getDefaultMessage(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) {
      return 'Request successful';
    }

    return 'Request completed';
  }
}
