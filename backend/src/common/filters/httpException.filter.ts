import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : null;

    let message = 'Internal server error';
    let errorDetail = 'Error';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object'
    ) {
      // Lấy message chi tiết (ví dụ từ class-validator hoặc NestJS default exception response)
      const msg = (exceptionResponse as any).message || (exceptionResponse as any).error;
      if (Array.isArray(msg)) {
        message = msg.join(', ');
      } else if (typeof msg === 'string') {
        message = msg;
      }
      
      errorDetail = (exceptionResponse as any).error || (exceptionResponse as any).message || 'Error';
    } else if (exception instanceof Error) {
      message = exception.message;
      errorDetail = exception.name;
    }

    // Log lỗi 500 để quản trị viên dễ debug trên console
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error('Unhandled Exception:', exception);
      message = 'Internal server error';
      errorDetail = 'InternalServerError';
    }

    response.status(status).json({
      statusCode: status,
      message,
      data: null,
      error: errorDetail,
    });
  }
}
