import React, { useMemo } from 'react';
import {
  BarChart3,
  Utensils,
  Receipt,
  Wallet,
  Printer,
  Calendar,
  PieChart,
  Users,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/calculations';
import { NavTab } from '../components/layout/AppLayout';
import { generateMonthSummaryCSV, generateExpenseReportCSV } from '../utils/exportUtils';
import { useToast } from '../context/ToastContext';

interface ReportsPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigate }) => {
  const { activeMonth, summary, expenses, members, settings } = useApp();
  const { success } = useToast();

  const monthExpenses = useMemo(() => {
    if (!activeMonth) return [];
    return expenses.filter((e) => e.monthId === activeMonth.id);
  }, [expenses, activeMonth]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;
    monthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
      total += e.amount;
    });

    return Object.entries(map)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthExpenses]);

  // Expenses by member
  const payerStats = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;
    monthExpenses.forEach((e) => {
      map[e.paidByMemberId] = (map[e.paidByMemberId] || 0) + e.amount;
      total += e.amount;
    });

    return Object.entries(map)
      .map(([mId, amount]) => {
        const mem = members.find((m) => m.id === mId);
        return {
          memberId: mId,
          memberName: mem?.name || 'Unknown',
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [monthExpenses, members]);

  if (!activeMonth) {
    return (
      <div className="py-12 text-center max-w-md mx-auto">
        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">No active month</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">Select or create a month to view reports.</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const {
    totalMeals,
    totalBreakfast,
    totalLunch,
    totalDinner,
    totalMealExpenses,
    currentMealRate,
    totalSharedExpenses,
    totalExpenses,
    totalPayments,
    totalOutstandingDue,
    totalReceivable,
    memberSummaries,
  } = summary;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Monthly Reports &amp; Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {activeMonth.name} — Meal statistics, expense breakdown, and financial audits
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              generateMonthSummaryCSV(activeMonth, summary, settings);
              success('Settlement CSV downloaded');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs sm:text-sm font-semibold hover:bg-emerald-100 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Settlement (CSV)</span>
          </button>
          <button
            onClick={() => {
              const membersMap = new Map<string, string>();
              members.forEach((m) => membersMap.set(m.id, m.name));
              generateExpenseReportCSV(activeMonth, expenses, membersMap, settings);
              success('Expense Log CSV downloaded');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-500/20 text-xs sm:text-sm font-semibold hover:bg-sky-100 transition"
          >
            <Download className="w-4 h-4" />
            <span>Expenses (CSV)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition shadow-xs shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 1. Meal Report Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Utensils className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Meal Report</h2>
            <p className="text-xs text-slate-500">Distribution across meal types and members</p>
          </div>
        </div>

        {/* Meal Type Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Meals</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalMeals}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Breakfasts</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalBreakfast}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Lunches</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalLunch}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Dinners</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalDinner}</span>
          </div>
        </div>

        {/* Meals per member progress bars */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Meals per Member
          </h3>
          <div className="space-y-2.5">
            {memberSummaries.map((m) => {
              const pct = totalMeals > 0 ? (m.totalMeals / totalMeals) * 100 : 0;
              return (
                <div key={m.member.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {m.member.name}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {m.totalMeals} meals ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Expense Report Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Receipt className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Expense Report</h2>
            <p className="text-xs text-slate-500">Breakdown by category and market contributors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expenses by Category */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Expenses by Category
            </h3>
            {categoryStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No expenses recorded</p>
            ) : (
              <div className="space-y-2.5">
                {categoryStats.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.category}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount, settings.currencySymbol)} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expenses by Member (Paid By) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Market Expenses Paid By Member
            </h3>
            {payerStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No expenses recorded</p>
            ) : (
              <div className="space-y-2.5">
                {payerStats.map((item) => (
                  <div key={item.memberId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.memberName}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount, settings.currencySymbol)} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Financial Summary Report */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Wallet className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Financial Audit &amp; Reconciliation</h2>
            <p className="text-xs text-slate-500">Separation of food expenses (meal rate) vs shared utilities (direct split)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Meal Expenses</span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalMealExpenses, settings.currencySymbol)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Forms meal rate</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Shared Expenses</span>
            <span className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">
              {formatCurrency(totalSharedExpenses, settings.currencySymbol)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Wi-Fi, utilities, rent</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Meal Rate</span>
            <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {formatCurrency(currentMealRate, settings.currencySymbol)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{totalMeals} meals</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Spent</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {formatCurrency(totalExpenses, settings.currencySymbol)}
            </span>
            {activeMonth.budget && (
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Target: {formatCurrency(activeMonth.budget, settings.currencySymbol)}
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Collected</span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalPayments, settings.currencySymbol)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Deposits collected
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Dues Pending</span>
            <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400">
              {formatCurrency(totalOutstandingDue, settings.currencySymbol)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Owed to mess
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
