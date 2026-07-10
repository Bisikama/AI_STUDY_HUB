import { Controller, Get, Patch, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@CurrentUser('id') userId: string) {
    const data = await this.notificationsService.getNotifications(userId);
    return {
      statusCode: 200,
      message: 'Notifications retrieved successfully',
      data,
    };
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser('id') userId: string) {
    await this.notificationsService.markAllAsRead(userId);
    return {
      statusCode: 200,
      message: 'All notifications marked as read',
    };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.notificationsService.markAsRead(id, userId);
    return {
      statusCode: 200,
      message: 'Notification marked as read',
      data,
    };
  }
}
