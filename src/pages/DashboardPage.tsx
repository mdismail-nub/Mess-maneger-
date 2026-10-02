import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Receipt,
  CreditCard,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/calculations';
import { NavTab } from '../components/layout/AppLayout';
import { MonthSwitcherModal } from '../components/layout/MonthSwitcherModal';
import { MemberBalanceChart } from '../components/dashboard/MemberBalanceChart';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    activeMonth,
    summary,
    settings,
  } = useApp();

  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  if (!activeMonth) {
    return (
      <div className="py-16 text-center max-w-sm mx-auto space-y-3">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          No active month selected.
        </p>
        <button
          onClick={() => setIsMonthModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer"
        >
          Select or Create Month
        </button>
      </div>
    );
  }

  const {
    totalMeals,
    totalMealExpenses,
    totalSharedExpenses,
    currentMealRate,
    totalExpenses,
    totalPayments,
    memberSummaries,
  } = summary;

  // Net mess balance: total collected payments minus total expenses
  const netMessBalance = totalPayments - totalExpenses;

  return (
    <div className="space-y-4">
      <MonthSwitcherModal
        isOpen={isMonthModalOpen}
        onClose={() => setIsMonthModalOpen(false)}
      />

      {/* TOP HEADER: Month & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <button
            onClick={() => setIsMonthModalOpen(true)}
            className="flex items-center gap-1.5 text-lg sm:text-xl font-bold text-slate-900 dark:text-white hover:text-blue-600 transition cursor-pointer text-left group"
          >
            <span>{activeMonth.name}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {memberSummaries.length} members • {activeMonth.isClosed ? 'Closed' : 'Active'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('meals')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Meal</span>
          </button>
          <button
            onClick={() => onNavigate('expenses')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={() => onNavigate('payments')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            <span>Add Payment</span>
          </button>
        </div>
      </div>

      {/* CLEAN KPI SUMMARY: Meals, Meal Rate, Expenses, Balance */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800">
          <div className="pt-2 sm:pt-0 sm:pr-2 first:pt-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Meals
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {totalMeals}
            </span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Meal Rate
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
              {formatCurrency(currentMealRate, settings.currencySymbol)}
            </span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Meal Expenses
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(totalMealExpenses, settings.currencySymbol)}
            </span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Shared Expenses
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
              {formatCurrency(totalSharedExpenses, settings.currencySymbol)}
            </span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Total Expenses
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(totalExpenses, settings.currencySymbol)}
            </span>
          </div>

          <div className="pt-2 sm:pt-0 sm:pl-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Mess Balance
            </span>
            <span
              className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
                netMessBalance > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : netMessBalance < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {netMessBalance > 0 ? '+' : ''}
              {formatCurrency(netMessBalance, settings.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* GRAPH: INDICATES MEALS, MONEY + OR - */}
      <MemberBalanceChart
        memberSummaries={memberSummaries}
        currencySymbol={settings.currencySymbol}
      />

      {/* MEMBER SUMMARY TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Members
          </h2>
          <button
            onClick={() => onNavigate('monthend')}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Settlement view
          </button>
        </div>

        {memberSummaries.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No members recorded yet.{' '}
            <button
              onClick={() => onNavigate('members')}
              className="text-blue-600 font-medium hover:underline"
            >
              Add members
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-4">Member</th>
                    <th className="py-2.5 px-3 text-right">Meals</th>
                    <th className="py-2.5 px-3 text-right">Meal Cost</th>
                    <th className="py-2.5 px-3 text-right">Shared Cost</th>
                    <th className="py-2.5 px-3 text-right">Total Cost</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {memberSummaries.map((m) => {
                    const diff = m.totalPaid - m.totalPayable;
                    return (
                      <tr key={m.member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {m.member.name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                          {m.totalMeals}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                          {formatCurrency(m.foodCost, settings.currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                          {formatCurrency(m.sharedCost, settings.currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                          {formatCurrency(m.totalPayable, settings.currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                          {formatCurrency(m.totalPaid, settings.currencySymbol)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold tabular-nums">
                          {diff > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              +{formatCurrency(diff, settings.currencySymbol)}
                            </span>
                          ) : diff < 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              -{formatCurrency(Math.abs(diff), settings.currencySymbol)}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {formatCurrency(0, settings.currencySymbol)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Clean List */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {memberSummaries.map((m) => {
                const diff = m.totalPaid - m.totalPayable;
                return (
                  <div key={m.member.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">
                        {m.member.name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        {m.totalMeals} meals • Paid: {formatCurrency(m.totalPaid, settings.currencySymbol)} • Cost: {formatCurrency(m.totalPayable, settings.currencySymbol)}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-sm">
                        {diff > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(diff, settings.currencySymbol)}
                          </span>
                        ) : diff < 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            -{formatCurrency(Math.abs(diff), settings.currencySymbol)}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {formatCurrency(0, settings.currencySymbol)}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {diff > 0 ? 'Receivable' : diff < 0 ? 'Due' : 'Settled'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
