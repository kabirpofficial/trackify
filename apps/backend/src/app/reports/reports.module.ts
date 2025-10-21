import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ExpensesModule } from '../expenses/expenses.module'; // Import ExpensesModule

@Module({
  imports: [ExpensesModule], // Import the module that provides ExpensesService
  controllers: [ReportsController],
})
export class ReportsModule {}