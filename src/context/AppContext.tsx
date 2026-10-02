import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  ActivityLog,
  AppSettings,
  Expense,
  MealEntry,
  MealType,
  Member,
  Month,
  MonthFinancialSummary,
  Payment,
  SettlementTransaction,
} from '../types';
import {
  STORES,
  clearAllData,
  deleteFromStore,
  getAllFromStore,
  getSettings,
  logActivity,
  putManyToStore,
  putToStore,
} from '../db/indexedDB';
import {
  autoDetectExpenseType,
  calculateMonthSummary,
  calculateSettlement,
} from '../utils/calculations';
import { useToast } from './ToastContext';

interface AppContextType {
  loading: boolean;
  months: Month[];
  activeMonth: Month | null;
  members: Member[];
  meals: MealEntry[];
  expenses: Expense[];
  payments: Payment[];
  settings: AppSettings;
  activities: ActivityLog[];
  summary: MonthFinancialSummary;
  settlementTransactions: SettlementTransaction[];
  setActiveMonthId: (id: string) => void;
  createMonth: (name: string, startDate: string, copyMembers?: boolean, budget?: number) => Promise<Month>;
  updateMonth: (month: Month) => Promise<void>;
  setMonthBudget: (monthId: string, budget: number | undefined) => Promise<void>;
  toggleMonthClose: (monthId: string) => Promise<void>;
  addMember: (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Member>;
  updateMember: (member: Member) => Promise<void>;
  toggleMemberStatus: (memberId: string) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
  toggleMeal: (date: string, memberId: string, mealType: MealType) => Promise<void>;
  setDayMealsBatch: (date: string, mealType: MealType, enable: boolean) => Promise<void>;
  addExpense: (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'monthId'>) => Promise<Expense>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addPayment: (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'monthId'>) => Promise<Payment>;
  updatePayment: (payment: Payment) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  refreshData: () => Promise<void>;
  loadDemoData: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, error, info } = useToast();
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState<Month[]>([]);
  const [activeMonthId, setActiveMonthId] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    id: 'current_settings',
    messName: 'MessMate',
    currencySymbol: '৳',
    currencyCode: 'BDT',
    theme: 'light',
    categories: ['Rice', 'Vegetables', 'Meat', 'Fish', 'Eggs', 'Grocery', 'Oil', 'Spices', 'Gas', 'Utilities', 'Other'],
    updatedAt: new Date().toISOString(),
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Load all initial data from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const [fetchedMonths, fetchedMembers, fetchedMeals, fetchedExpenses, fetchedPayments, fetchedSettings, fetchedActivities] =
        await Promise.all([
          getAllFromStore<Month>(STORES.MONTHS),
          getAllFromStore<Member>(STORES.MEMBERS),
          getAllFromStore<MealEntry>(STORES.MEALS),
          getAllFromStore<Expense>(STORES.EXPENSES),
          getAllFromStore<Payment>(STORES.PAYMENTS),
          getSettings(),
          getAllFromStore<ActivityLog>(STORES.ACTIVITIES),
        ]);

      // Sort months newest first
      fetchedMonths.sort((a, b) => b.startDate.localeCompare(a.startDate));

      // Safe migration & verification of existing expenses to guarantee separation
      let hasExpenseUpdates = false;
      const validatedExpenses: Expense[] = fetchedExpenses.map((exp) => {
        let updatedExp = { ...exp };
        const detection = autoDetectExpenseType(exp.title, exp.category);

        // 1. Missing or invalid type
        if (exp.type !== 'meal' && exp.type !== 'shared') {
          hasExpenseUpdates = true;
          updatedExp.type = detection.type;
          updatedExp.splitMethod = exp.splitMethod || (detection.type === 'shared' ? 'equal' : undefined);
          updatedExp.needsReview = !detection.isConfident;
        }
        // 2. Misclassified shared expense: was saved as 'meal', but is explicitly a utility/shared bill (e.g. Wi-Fi, Gas, Electricity)
        else if (exp.type === 'meal' && detection.type === 'shared' && detection.isConfident) {
          hasExpenseUpdates = true;
          updatedExp.type = 'shared';
          updatedExp.splitMethod = exp.splitMethod || 'equal';
          updatedExp.needsReview = false;
        }

        return updatedExp;
      });

      if (hasExpenseUpdates) {
        await putManyToStore(STORES.EXPENSES, validatedExpenses);
      }

      setMonths(fetchedMonths);
      setMembers(fetchedMembers);
      setMeals(fetchedMeals);
      setExpenses(validatedExpenses);
      setPayments(fetchedPayments);
      setSettings(fetchedSettings);

      // Sort activities newest first
      fetchedActivities.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setActivities(fetchedActivities.slice(0, 30));

      // Set active month
      if (fetchedMonths.length > 0) {
        if (!activeMonthId || !fetchedMonths.some((m) => m.id === activeMonthId)) {
          setActiveMonthId(fetchedMonths[0].id);
        }
      } else {
        setActiveMonthId('');
      }

      // Apply theme to document
      if (fetchedSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (fetchedSettings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      }
    } catch (err) {
      console.error('Failed to load local data:', err);
      error('Failed to load local database');
    } finally {
      setLoading(false);
    }
  }, [activeMonthId, error]);

  useEffect(() => {
    refreshData();
  }, []);

  const activeMonth = useMemo(() => {
    return months.find((m) => m.id === activeMonthId) || null;
  }, [months, activeMonthId]);

  // Derived financial summary for active month
  const summary = useMemo<MonthFinancialSummary>(() => {
    if (!activeMonth) {
      return {
        totalMembers: 0,
        totalMeals: 0,
        totalBreakfast: 0,
        totalLunch: 0,
        totalDinner: 0,
        totalMealExpenses: 0,
        currentMealRate: 0,
        totalSharedExpenses: 0,
        totalExpenses: 0,
        totalPayments: 0,
        totalOutstandingDue: 0,
        totalReceivable: 0,
        memberSummaries: [],
      };
    }
    return calculateMonthSummary(activeMonth, members, meals, expenses, payments);
  }, [activeMonth, members, meals, expenses, payments]);

  // Settlement suggestions
  const settlementTransactions = useMemo(() => {
    return calculateSettlement(summary.memberSummaries);
  }, [summary.memberSummaries]);

  // Month creation
  const createMonth = async (
    name: string,
    startDate: string,
    copyMembers: boolean = true,
    budget?: number
  ): Promise<Month> => {
    const id = `month_${startDate.slice(0, 7)}_${Math.random().toString(36).substring(2, 6)}`;
    const activeMemberIds = copyMembers
      ? members.filter((m) => m.status === 'active').map((m) => m.id)
      : [];

    const newMonth: Month = {
      id,
      name,
      startDate,
      budget: budget !== undefined && budget > 0 ? budget : settings.defaultMonthlyBudget,
      isClosed: false,
      memberIds: activeMemberIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await putToStore(STORES.MONTHS, newMonth);
    await logActivity(id, `Created month "${name}"`, 'month');
    success(`Month "${name}" created`);
    await refreshData();
    setActiveMonthId(id);
    return newMonth;
  };

  const updateMonth = async (month: Month) => {
    const updated: Month = {
      ...month,
      updatedAt: new Date().toISOString(),
    };
    await putToStore(STORES.MONTHS, updated);
    success(`Month "${month.name}" updated`);
    await refreshData();
  };

  const setMonthBudget = async (monthId: string, budget: number | undefined) => {
    const month = months.find((m) => m.id === monthId);
    if (!month) return;
    const updated: Month = {
      ...month,
      budget: budget && budget > 0 ? budget : undefined,
      updatedAt: new Date().toISOString(),
    };
    await putToStore(STORES.MONTHS, updated);
    if (budget && budget > 0) {
      await logActivity(
        monthId,
        `Updated monthly expense budget target to ${settings.currencySymbol}${budget.toLocaleString()}`,
        'month'
      );
      success(`Monthly budget set to ${settings.currencySymbol}${budget.toLocaleString()}`);
    } else {
      await logActivity(monthId, `Removed monthly budget target`, 'month');
      info(`Monthly budget target removed`);
    }
    await refreshData();
  };

  const toggleMonthClose = async (monthId: string) => {
    const month = months.find((m) => m.id === monthId);
    if (!month) return;
    const updated: Month = {
      ...month,
      isClosed: !month.isClosed,
      updatedAt: new Date().toISOString(),
    };
    await putToStore(STORES.MONTHS, updated);
    await logActivity(
      monthId,
      `${updated.isClosed ? 'Closed' : 'Reopened'} month "${month.name}"`,
      'month'
    );
    info(`Month "${month.name}" is now ${updated.isClosed ? 'closed' : 'open'}`);
    await refreshData();
  };

  // Member Management
  const addMember = async (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<Member> => {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMember: Member = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await putToStore(STORES.MEMBERS, newMember);

    // If there's an active month, add member to it as well
    if (activeMonth) {
      const updatedMonth: Month = {
        ...activeMonth,
        memberIds: Array.from(new Set([...activeMonth.memberIds, id])),
        updatedAt: new Date().toISOString(),
      };
      await putToStore(STORES.MONTHS, updatedMonth);
      await logActivity(activeMonth.id, `Added member "${newMember.name}"`, 'member');
    }

    success(`Member "${newMember.name}" added`);
    await refreshData();
    return newMember;
  };

  const updateMember = async (member: Member) => {
    const updated: Member = {
      ...member,
      updatedAt: new Date().toISOString(),
    };
    await putToStore(STORES.MEMBERS, updated);
    success(`Updated member "${member.name}"`);
    await refreshData();
  };

  const toggleMemberStatus = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    const updated: Member = {
      ...member,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    await putToStore(STORES.MEMBERS, updated);
    info(`Member "${member.name}" is now ${newStatus}`);
    await refreshData();
  };

  // Safe soft remove: marks inactive so old historical records remain intact
  const deleteMember = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    // Check if member has historical records
    const hasMeals = meals.some((m) => m.memberId === memberId);
    const hasExpenses = expenses.some((e) => e.paidByMemberId === memberId);
    const hasPayments = payments.some((p) => p.memberId === memberId);

    if (hasMeals || hasExpenses || hasPayments) {
      // Soft deletion - mark as inactive and remove from active month
      const updated: Member = {
        ...member,
        status: 'inactive',
        updatedAt: new Date().toISOString(),
      };
      await putToStore(STORES.MEMBERS, updated);
      if (activeMonth) {
        const updatedMonth: Month = {
          ...activeMonth,
          memberIds: activeMonth.memberIds.filter((id) => id !== memberId),
          updatedAt: new Date().toISOString(),
        };
        await putToStore(STORES.MONTHS, updatedMonth);
      }
      info(`Member "${member.name}" has historical records. Marked as inactive to protect data.`);
    } else {
      // Can safely delete permanently since there's zero history
      await deleteFromStore(STORES.MEMBERS, memberId);
      if (activeMonth) {
        const updatedMonth: Month = {
          ...activeMonth,
          memberIds: activeMonth.memberIds.filter((id) => id !== memberId),
          updatedAt: new Date().toISOString(),
        };
        await putToStore(STORES.MONTHS, updatedMonth);
      }
      success(`Member "${member.name}" removed`);
    }

    await refreshData();
  };

  // Meal Tracking
  const toggleMeal = async (date: string, memberId: string, mealType: MealType) => {
    if (!activeMonth) return;
    if (activeMonth.isClosed) {
      error('Month is closed. Reopen to record meals.');
      return;
    }

    const mealId = `${activeMonth.id}_${date}_${memberId}`;
    const existing = meals.find((m) => m.id === mealId);

    const updatedMeal: MealEntry = existing
      ? {
          ...existing,
          [mealType]: !existing[mealType],
          updatedAt: new Date().toISOString(),
        }
      : {
          id: mealId,
          monthId: activeMonth.id,
          date,
          memberId,
          breakfast: mealType === 'breakfast',
          lunch: mealType === 'lunch',
          dinner: mealType === 'dinner',
          updatedAt: new Date().toISOString(),
        };

    await putToStore(STORES.MEALS, updatedMeal);

    const member = members.find((m) => m.id === memberId);
    const totalDay =
      (updatedMeal.breakfast ? 1 : 0) +
      (updatedMeal.lunch ? 1 : 0) +
      (updatedMeal.dinner ? 1 : 0);

    await logActivity(
      activeMonth.id,
      `${member?.name || 'Member'} updated meals on ${date} (${totalDay} meals)`,
      'meal'
    );

    await refreshData();
  };

  const setDayMealsBatch = async (date: string, mealType: MealType, enable: boolean) => {
    if (!activeMonth) return;
    if (activeMonth.isClosed) {
      error('Month is closed. Reopen to record meals.');
      return;
    }

    const relevantMembers = members.filter((m) => {
      if (activeMonth.memberIds?.length) return activeMonth.memberIds.includes(m.id);
      return m.status === 'active';
    });

    const updates: MealEntry[] = [];
    for (const mem of relevantMembers) {
      const mealId = `${activeMonth.id}_${date}_${mem.id}`;
      const existing = meals.find((m) => m.id === mealId);

      const item: MealEntry = existing
        ? {
            ...existing,
            [mealType]: enable,
            updatedAt: new Date().toISOString(),
          }
        : {
            id: mealId,
            monthId: activeMonth.id,
            date,
            memberId: mem.id,
            breakfast: mealType === 'breakfast' ? enable : false,
            lunch: mealType === 'lunch' ? enable : false,
            dinner: mealType === 'dinner' ? enable : false,
            updatedAt: new Date().toISOString(),
          };
      updates.push(item);
    }

    await putManyToStore(STORES.MEALS, updates);
    success(`Set all ${mealType} meals to ${enable ? 'active' : 'inactive'} for ${date}`);
    await refreshData();
  };

  // Expenses
  const addExpense = async (
    data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'monthId'>
  ): Promise<Expense> => {
    if (!activeMonth) throw new Error('No active month');
    if (activeMonth.isClosed) {
      error('Month is closed. Reopen to add expenses.');
      throw new Error('Month is closed');
    }

    const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newExpense: Expense = {
      ...data,
      id,
      monthId: activeMonth.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await putToStore(STORES.EXPENSES, newExpense);

    const payer = members.find((m) => m.id === data.paidByMemberId);
    await logActivity(
      activeMonth.id,
      `${payer?.name || 'Someone'} added ${settings.currencySymbol}${data.amount.toLocaleString()} for ${data.title}`,
      'expense'
    );

    success(`Expense "${data.title}" added`);
    await refreshData();
    return newExpense;
  };

  const updateExpense = async (expense: Expense) => {
    if (!activeMonth) return;
    if (activeMonth.isClosed) {
      error('Month is closed. Reopen to edit expenses.');
      return;
    }
    const updated: Expense = {
      ...expense,
      updatedAt: new Date().toISOString(),
    };
    await putToStore(STORES.EXPENSES, updated);
    success(`Updated expense "${expense.title}"`);
    await refreshData();
  };

  const deleteExpense = async (id: string) => {
    if (!activeMonth) return;
    if (activeMonth.isClosed) {
      error('Month is closed. Reopen to delete expenses.');
      return;
    }
    await deleteFromStore(STORES.EXPENSES, id);
    success('Expense deleted');
    await refreshData();
  };

  // Payments
  const addPayment = async (
    data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'monthId'>
  ): Promise<Payment> => {
    if (!activeMonth) throw new Error('No active month');
    if (activeMonth.isClosed) {
      error('Month is closed. Reopen to record payments.');
      throw new Error('Month is closed');
    }

    const id = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPayment: Payment = {
      ...data,
      id,
      monthId: activeMonth.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await putToStore(STORES.PAYMENTS, newPayment);

    const member = members.find((m) => m.id === data.memberId);
    await logActivity(
      activeMonth.id,
      `${member?.name || 'Member'} paid ${settings.currencySymbol}${data.amount.toLocaleString()} via ${data.method}`,
      'payment'
    );

    success(`Payment of ${settings.currencySymbol}${data.amount.toLocaleString()} recorded`);
    await refreshData();
    return newPayment;
  };

  const updatePayment = async (payment: Payment) => {
    if (!activeMonth) return;
    if (activeMonth.isClosed) {
      error('Month is closed. Reopen to edit payments.');
      return;
    }
    const updated: Payment = {
      ...payment,
      updatedAt: new Date().toISOString(),
    };
    await putToStore(STORES.PAYMENTS, updated);
    success('Payment updated');
    await refreshData();
  };

  const deletePayment = async (id: string) => {
    if (!activeMonth) return;
    if (activeMonth.isClosed) {
      error('Month is closed. Reopen to delete payments.');
      return;
    }
    await deleteFromStore(STORES.PAYMENTS, id);
    success('Payment deleted');
    await refreshData();
  };

  // Settings
  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated: AppSettings = {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };
    await putToStore(STORES.SETTINGS, updated);
    setSettings(updated);

    if (updated.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (updated.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }

    success('Settings updated');
  };

  // Test / Demo Data Loader matching specification exactly:
  // Ismail: 45 meals, Rahim: 38 meals, Karim: 42 meals, Hasan: 35 meals -> Total: 160 meals
  // Meal expenses: ৳8,000 -> Meal rate: ৳50.00
  // Food cost: Ismail ৳2,250, Rahim ৳1,900, Karim ৳2,100, Hasan ৳1,750
  const loadDemoData = async () => {
    try {
      setLoading(true);
      await clearAllData();

      const mIsmail: Member = {
        id: 'mem_ismail',
        name: 'Ismail',
        phone: '01711000001',
        joinDate: '2026-09-01',
        status: 'active',
        notes: 'Mess Manager',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const mRahim: Member = {
        id: 'mem_rahim',
        name: 'Rahim',
        phone: '01811000002',
        joinDate: '2026-09-01',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const mKarim: Member = {
        id: 'mem_karim',
        name: 'Karim',
        phone: '01911000003',
        joinDate: '2026-09-01',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const mHasan: Member = {
        id: 'mem_hasan',
        name: 'Hasan',
        phone: '01611000004',
        joinDate: '2026-09-01',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const demoMonth: Month = {
        id: 'month_2026-09',
        name: 'September 2026',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        budget: 9000,
        isClosed: false,
        memberIds: ['mem_ismail', 'mem_rahim', 'mem_karim', 'mem_hasan'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Generate meal records matching:
      // Ismail: 45 meals (15 days x 3 meals)
      // Rahim: 38 meals (12 days x 3 meals + 2 days x 1 meal)
      // Karim: 42 meals (14 days x 3 meals)
      // Hasan: 35 meals (11 days x 3 meals + 1 day x 2 meals)
      const demoMeals: MealEntry[] = [];
      const createDays = (
        memberId: string,
        targetCount: number
      ) => {
        let remaining = targetCount;
        for (let day = 1; day <= 30 && remaining > 0; day++) {
          const dayStr = day < 10 ? `0${day}` : `${day}`;
          const date = `2026-09-${dayStr}`;
          const b = remaining >= 1;
          if (b) remaining--;
          const l = remaining >= 1;
          if (l) remaining--;
          const d = remaining >= 1;
          if (d) remaining--;

          demoMeals.push({
            id: `month_2026-09_${date}_${memberId}`,
            monthId: 'month_2026-09',
            date,
            memberId,
            breakfast: b,
            lunch: l,
            dinner: d,
            updatedAt: new Date().toISOString(),
          });
        }
      };

      createDays('mem_ismail', 45);
      createDays('mem_rahim', 38);
      createDays('mem_karim', 42);
      createDays('mem_hasan', 35);

      // Meal Expenses totaling exactly ৳8,000
      const demoExpenses: Expense[] = [
        {
          id: 'exp_1',
          monthId: 'month_2026-09',
          title: 'Monthly Rice (50kg)',
          amount: 3200,
          date: '2026-09-02',
          category: 'Rice',
          paidByMemberId: 'mem_ismail',
          type: 'meal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'exp_2',
          monthId: 'month_2026-09',
          title: 'Chicken & Beef',
          amount: 2800,
          date: '2026-09-10',
          category: 'Meat',
          paidByMemberId: 'mem_rahim',
          type: 'meal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'exp_3',
          monthId: 'month_2026-09',
          title: 'Fish Market',
          amount: 1200,
          date: '2026-09-18',
          category: 'Fish',
          paidByMemberId: 'mem_karim',
          type: 'meal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'exp_4',
          monthId: 'month_2026-09',
          title: 'Vegetables & Spices',
          amount: 800,
          date: '2026-09-25',
          category: 'Vegetables',
          paidByMemberId: 'mem_hasan',
          type: 'meal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'exp_5',
          monthId: 'month_2026-09',
          title: 'High-speed Wi-Fi Internet',
          amount: 1000,
          date: '2026-09-08',
          category: 'Utilities',
          paidByMemberId: 'mem_ismail',
          type: 'shared',
          splitMethod: 'equal',
          note: 'Shared household cost - does not affect meal rate',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Sample payments
      const demoPayments: Payment[] = [
        {
          id: 'pay_1',
          monthId: 'month_2026-09',
          memberId: 'mem_ismail',
          amount: 2500,
          date: '2026-09-05',
          method: 'bKash',
          note: 'Deposit',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'pay_2',
          monthId: 'month_2026-09',
          memberId: 'mem_rahim',
          amount: 2000,
          date: '2026-09-05',
          method: 'Cash',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'pay_3',
          monthId: 'month_2026-09',
          memberId: 'mem_karim',
          amount: 2000,
          date: '2026-09-06',
          method: 'Nagad',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'pay_4',
          monthId: 'month_2026-09',
          memberId: 'mem_hasan',
          amount: 1500,
          date: '2026-09-07',
          method: 'Cash',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await putManyToStore(STORES.MEMBERS, [mIsmail, mRahim, mKarim, mHasan]);
      await putToStore(STORES.MONTHS, demoMonth);
      await putManyToStore(STORES.MEALS, demoMeals);
      await putManyToStore(STORES.EXPENSES, demoExpenses);
      await putManyToStore(STORES.PAYMENTS, demoPayments);

      await logActivity('month_2026-09', 'Loaded standard demo dataset for September 2026', 'month');

      success('Test demo data loaded (160 meals, ৳8,000 expenses, ৳50 meal rate)!');
      await refreshData();
      setActiveMonthId('month_2026-09');
    } catch (err) {
      console.error(err);
      error('Failed to load demo data');
    } finally {
      setLoading(false);
    }
  };

  const resetAllData = async () => {
    try {
      setLoading(true);
      await clearAllData();
      success('All local data cleared');
      await refreshData();
      setActiveMonthId('');
    } catch (err) {
      console.error(err);
      error('Failed to clear data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        loading,
        months,
        activeMonth,
        members,
        meals,
        expenses,
        payments,
        settings,
        activities,
        summary,
        settlementTransactions,
        setActiveMonthId,
        createMonth,
        updateMonth,
        setMonthBudget,
        toggleMonthClose,
        addMember,
        updateMember,
        toggleMemberStatus,
        deleteMember,
        toggleMeal,
        setDayMealsBatch,
        addExpense,
        updateExpense,
        deleteExpense,
        addPayment,
        updatePayment,
        deletePayment,
        updateSettings,
        refreshData,
        loadDemoData,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
