import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ExpensesService } from '../expenses/expenses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private expensesService: ExpensesService) {}

  @Get('summary')
  async getSummary(@Request() req) {
    return this.expensesService.getSummary(req.user.userId);
  }
}