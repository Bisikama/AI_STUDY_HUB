import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Log để kiểm tra user
    console.log('>>> [DEBUG] User từ request:', user);

    if (!user || !user.role) {
      throw new ForbiddenException('Bạn chưa đăng nhập hoặc không có quyền!');
    }

    // So sánh quyền (không phân biệt hoa/thường)
    const hasRole = requiredRoles.some((role) => role.toUpperCase() === user.role.toUpperCase());

    if (!hasRole) {
      throw new ForbiddenException(`Bạn cần quyền ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
