import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
    private categoriesService: CategoriesService,
  ) {}

  async findAll(userId: number): Promise<Expense[]> {
    return this.expensesRepository.find({
      where: { userId },
      relations: ['category'],
      order: { date: 'DESC' },
    });
  }

  async create(userId: number, createExpenseDto: CreateExpenseDto): Promise<Expense> {
    // Verify category belongs to user
    await this.categoriesService.findOne(createExpenseDto.categoryId, userId);

    const expense = this.expensesRepository.create({
      ...createExpenseDto,
      userId,
    });

    return this.expensesRepository.save(expense);
  }

  async getSummary(userId: number): Promise<any> {
    const expenses = await this.expensesRepository.find({
      where: { userId },
      relations: ['category'],
    });

    const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount as any), 0);

    const byCategory = expenses.reduce((acc, expense) => {
      const categoryName = expense.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += parseFloat(expense.amount as any);
      return acc;
    }, {});

    const byCategoryArray = Object.entries(byCategory).map(([categoryName, total]) => ({
      categoryName,
      total,
      percentage: total / total * 100,
    }));

    return {
      total,
      byCategory: byCategoryArray,
    };
  }
}