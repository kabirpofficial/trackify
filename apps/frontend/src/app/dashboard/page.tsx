'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface User {
  id: number;
  name: string;
  email: string;
}

interface Category {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  amount: number | string;
  description: string;
  date: string;
  categoryId: number;
  category?: Category;
}

// API base URL - you can move this to an environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    categoryCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>(null);
  const [categoryChartData, setCategoryChartData] = useState<any>(null);
  const [activeChart, setActiveChart] = useState<'monthly' | 'categories'>('monthly');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching data from:', API_BASE_URL);
      
      // Test API connection first
      try {
        const testResponse = await fetch(`${API_BASE_URL}/api/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        console.log('API health check:', testResponse.status);
      } catch (healthError) {
        console.warn('Health check failed, continuing anyway...');
      }
      
      // Fetch expenses and categories in parallel with timeout
      const fetchWithTimeout = (url: string, options: RequestInit, timeout = 8000) => {
        return Promise.race([
          fetch(url, options),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
      };

      const [expensesResponse, categoriesResponse] = await Promise.allSettled([
        fetchWithTimeout(`${API_BASE_URL}/api/expenses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetchWithTimeout(`${API_BASE_URL}/api/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      let expensesData: Expense[] = [];
      let categoriesData: Category[] = [];

      // Handle expenses response
      if (expensesResponse.status === 'fulfilled' && expensesResponse.value.ok) {
        expensesData = await expensesResponse.value.json();
        setExpenses(expensesData);
        console.log('Expenses loaded:', expensesData.length);
      } else if (expensesResponse.status === 'fulfilled') {
        console.error('Expenses API error:', expensesResponse.value.status);
        throw new Error(`Failed to fetch expenses: ${expensesResponse.value.status}`);
      } else {
        console.error('Expenses fetch failed:', expensesResponse.reason);
        throw new Error('Failed to connect to expenses API');
      }

      // Handle categories response
      if (categoriesResponse.status === 'fulfilled' && categoriesResponse.value.ok) {
        categoriesData = await categoriesResponse.value.json();
        setCategories(categoriesData);
        console.log('Categories loaded:', categoriesData.length);
      } else if (categoriesResponse.status === 'fulfilled') {
        console.error('Categories API error:', categoriesResponse.value.status);
        // Don't throw for categories, we can still show the dashboard
        console.warn('Categories fetch failed, continuing without categories...');
      } else {
        console.warn('Categories fetch failed, continuing without categories:', categoriesResponse.reason);
      }

      // Calculate stats with both expenses and categories data
      calculateStats(expensesData, categoriesData);
      
      // Prepare chart data
      prepareChartData(expensesData, categoriesData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to load dashboard data. Please check if the backend server is running.'
      );
      
      // Set empty data for charts to prevent errors
      setChartData(getEmptyChartData());
      setCategoryChartData(getEmptyCategoryData());
    } finally {
      setLoading(false);
    }
  };

  const getEmptyChartData = () => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Expenses',
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(156, 163, 175, 0.6)',
        borderColor: 'rgba(156, 163, 175, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  });

  const getEmptyCategoryData = () => ({
    labels: ['No Data'],
    datasets: [
      {
        data: [1],
        backgroundColor: ['rgba(156, 163, 175, 0.6)'],
        borderColor: ['rgba(156, 163, 175, 1)'],
        borderWidth: 2,
      },
    ],
  });

  const calculateStats = (expensesData: Expense[], categoriesData: Category[]) => {
    // Convert amount to number and calculate totals
    const total = expensesData.reduce((sum: number, expense: Expense) => {
      const amount = typeof expense.amount === 'string' 
        ? parseFloat(expense.amount) 
        : expense.amount;
      return sum + (amount || 0);
    }, 0);

    const monthly = expensesData
      .filter((expense: Expense) => {
        const expenseDate = new Date(expense.date);
        const now = new Date();
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum: number, expense: Expense) => {
        const amount = typeof expense.amount === 'string' 
          ? parseFloat(expense.amount) 
          : expense.amount;
        return sum + (amount || 0);
      }, 0);

    setStats({
      totalExpenses: total,
      monthlyExpenses: monthly,
      categoryCount: categoriesData.length,
    });
  };

  const prepareChartData = (expensesData: Expense[], categoriesData: Category[]) => {
    // Prepare monthly expenses data for the last 6 months
    const monthlyData = prepareMonthlyData(expensesData);
    setChartData(monthlyData);

    // Prepare category-wise spending data
    const categoryData = prepareCategoryData(expensesData, categoriesData);
    setCategoryChartData(categoryData);
  };

  const prepareMonthlyData = (expensesData: Expense[]) => {
    const months = [];
    const currentDate = new Date();
    
    // Generate last 6 months labels
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    }

    // Calculate expenses for each month
    const monthlyExpenses = months.map((_, index) => {
      const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - index), 1);
      const monthExpenses = expensesData.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === targetMonth.getMonth() && 
               expenseDate.getFullYear() === targetMonth.getFullYear();
      });

      return monthExpenses.reduce((sum, expense) => {
        const amount = typeof expense.amount === 'string' 
          ? parseFloat(expense.amount) 
          : expense.amount;
        return sum + (amount || 0);
      }, 0);
    });

    return {
      labels: months,
      datasets: [
        {
          label: 'Monthly Expenses',
          data: monthlyExpenses,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  };

  const prepareCategoryData = (expensesData: Expense[], categoriesData: Category[]) => {
    if (expensesData.length === 0) {
      return getEmptyCategoryData();
    }

    const categoryMap = new Map();
    
    // Initialize all categories with 0
    categoriesData.forEach(category => {
      categoryMap.set(category.id, {
        name: category.name,
        amount: 0,
        color: generateColor(category.id)
      });
    });

    // Calculate expenses per category
    expensesData.forEach(expense => {
      const amount = typeof expense.amount === 'string' 
        ? parseFloat(expense.amount) 
        : expense.amount;
      
      if (categoryMap.has(expense.categoryId)) {
        const category = categoryMap.get(expense.categoryId);
        category.amount += amount || 0;
      } else {
        // For expenses without category or with unknown category
        categoryMap.set(-1, {
          name: 'Uncategorized',
          amount: (categoryMap.get(-1)?.amount || 0) + (amount || 0),
          color: '#6B7280'
        });
      }
    });

    // Filter out categories with no expenses and sort by amount
    const categoriesWithExpenses = Array.from(categoryMap.values())
      .filter(category => category.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    if (categoriesWithExpenses.length === 0) {
      return getEmptyCategoryData();
    }

    return {
      labels: categoriesWithExpenses.map(category => category.name),
      datasets: [
        {
          data: categoriesWithExpenses.map(category => category.amount),
          backgroundColor: categoriesWithExpenses.map(category => category.color),
          borderColor: categoriesWithExpenses.map(category => 
            category.color.replace('0.6', '1')
          ),
          borderWidth: 2,
        },
      ],
    };
  };

  // Helper function to generate consistent colors
  const generateColor = (seed: number) => {
    const colors = [
      'rgba(59, 130, 246, 0.6)',   // blue
      'rgba(16, 185, 129, 0.6)',   // green
      'rgba(245, 158, 11, 0.6)',   // yellow
      'rgba(239, 68, 68, 0.6)',    // red
      'rgba(139, 92, 246, 0.6)',   // purple
      'rgba(14, 165, 233, 0.6)',   // cyan
      'rgba(20, 184, 166, 0.6)',   // teal
      'rgba(249, 115, 22, 0.6)',   // orange
    ];
    return colors[Math.abs(seed) % colors.length];
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleRetry = () => {
    fetchData();
  };

  // Helper function to format amount safely
  const formatAmount = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  // Chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Expense Trends',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value;
          }
        }
      }
    }
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Spending by Category',
      },
    },
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Trackify</span>
              </Link>
              <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                Welcome, {user.name}!
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/add-expense"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Expense
              </Link>
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 px-4 sm:px-0">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                      Connection Error
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:text-red-300 dark:bg-red-800 dark:hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-4 sm:px-0">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">$</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Expenses
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      ${stats.totalExpenses.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-sm">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      This Month
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      ${stats.monthlyExpenses.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 text-sm">📁</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Categories
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats.categoryCount}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {!error && (
          <div className="mb-8 px-4 sm:px-0">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Expense Analytics
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setActiveChart('monthly')}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        activeChart === 'monthly'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Monthly Trend
                    </button>
                    <button
                      onClick={() => setActiveChart('categories')}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        activeChart === 'categories'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      By Category
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading charts...</p>
                    </div>
                  </div>
                ) : expenses.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📈</div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No data for charts</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Add some expenses to see beautiful charts.
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/add-expense"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Expense
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="h-80">
                    {activeChart === 'monthly' && chartData && (
                      <Bar data={chartData} options={barChartOptions} />
                    )}
                    {activeChart === 'categories' && categoryChartData && (
                      <div className="flex justify-center items-center h-full">
                        <div className="w-80 h-80">
                          <Doughnut data={categoryChartData} options={doughnutChartOptions} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rest of your existing components... */}
        {/* (Recent Expenses, Categories, Quick Actions sections remain the same) */}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0">
          {/* Recent Expenses */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Recent Expenses
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading expenses...</p>
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">💰</div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No expenses yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Get started by adding your first expense.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/add-expense"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Expense
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {expense.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${formatAmount(expense.amount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {expense.category?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {expenses.length > 5 && (
                    <div className="text-center pt-4">
                      <Link
                        href="/expenses"
                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        View all expenses
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Categories ({categories.length})
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading categories...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📁</div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No categories</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Create categories to organize your expenses.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/categories"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Manage Categories
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-600"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {category.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/add-expense"
              className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Expense
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Manage Categories
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}