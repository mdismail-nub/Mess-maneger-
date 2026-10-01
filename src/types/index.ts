export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type ExpenseType = 'meal' | 'shared';

export type SharedExpenseSplitMethod = 'equal' | 'meal_based' | 'custom';

export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Other';

export interface Month {
  id: string; // e.g., "2026-09"
  name: string; // e.g., "September 2026"
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  isClosed: boolean;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  name: string;
  phone?: string;
  joinDate: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealEntry {
  id: string; // `${monthId}_${date}_${memberId}`
  monthId: string;
  date: string; // YYYY-MM-DD
  memberId: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  updatedAt: string;
}

export interface Expense {
  id: string;
  monthId: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  paidByMemberId: string;
  type: ExpenseType; // 'meal' or 'shared'
  splitMethod?: SharedExpenseSplitMethod;
  customShares?: Record<string, number>; // memberId -> amount
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  monthId: string;
  memberId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  method: PaymentMethod;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: 'current_settings';
  messName: string;
  currencySymbol: string;
  currencyCode: string;
  theme: 'light' | 'dark' | 'system';
  categories: string[];
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  monthId: string;
  timestamp: string;
  description: string;
  type: 'meal' | 'expense' | 'payment' | 'member' | 'month';
}

export interface MemberMonthSummary {
  member: Member;
  totalMeals: number;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  foodCost: number;
  sharedCost: number;
  totalPayable: number;
  totalPaid: number;
  balance: number; // positive = Due, negative = Receivable, 0 = Settled
  status: 'due' | 'receivable' | 'settled';
}

export interface MonthFinancialSummary {
  totalMembers: number;
  totalMeals: number;
  totalBreakfast: number;
  totalLunch: number;
  totalDinner: number;
  totalMealExpenses: number;
  currentMealRate: number;
  totalSharedExpenses: number;
  totalExpenses: number;
  totalPayments: number;
  totalOutstandingDue: number;
  totalReceivable: number;
  memberSummaries: MemberMonthSummary[];
}

export interface SettlementTransaction {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
}
