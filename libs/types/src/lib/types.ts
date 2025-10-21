export function types(): string {

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: Omit<User, 'password'>;
}

// Category related types
export interface Category {
  id: number;
  name: string;
  userId: number;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryDto {
  name: string;
}

// Expense related types
export interface Expense {
  id: number;
  amount: number;
  description: string;
  date: Date;
  categoryId: number;
  userId: number;
  category?: Category;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseDto {
  amount: number;
  description: string;
  date: Date;
  categoryId: number;
}

// Report types
export interface ExpenseSummary {
  total: number;
  byCategory: Array<{
    categoryName: string;
    total: number;
    percentage: number;
  }>;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}