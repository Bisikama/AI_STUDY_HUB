import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Req() req: any) {
    const userId = req.user.id;
    const data = await this.dashboardService.getDashboardData(userId);
    return {
      statusCode: 200,
      message: 'Retrieve dashboard data successfully',
      data,
    };
  }
}
