import React, { useMemo, useState } from 'react';
import {
  UtensilsCrossed,
  Receipt,
  CreditCard,
  Plus,
  Download,
  Calendar,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/calculations';
import { NavTab } from '../components/layout/AppLayout';
import { MonthSwitcherModal } from '../components/layout/MonthSwitcherModal';
import { SpendingTrendChart } from '../components/dashboard/SpendingTrendChart';
import { generateMonthSummaryCSV, generateExpenseReportCSV } from '../utils/exportUtils';
import { AppInstallModal } from '../components/common/AppInstallModal';
import { useToast } from '../context/ToastContext';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    activeMonth,
    summary,
    expenses,
    settings,
  } = useApp();
  const { success } = useToast();

  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const monthExpenses = useMemo(() => {
    if (!activeMonth) return [];
    return expenses.filter((e) => e.monthId === activeMonth.id);
  }, [expenses, activeMonth]);

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
    currentMealRate,
    totalExpenses,
    totalPayments,
    memberSummaries,
  } = summary;

  // Net mess balance: total collected payments minus total expenses
  const netMessBalance = totalPayments - totalExpenses;

  const handleDownloadSummary = () => {
    generateMonthSummaryCSV(activeMonth, summary, settings);
    success('Settlement CSV downloaded');
  };

  const handleDownloadExpenses = () => {
    const membersNameMap = new Map<string, string>();
    memberSummaries.forEach((m) => membersNameMap.set(m.member.id, m.member.name));
    generateExpenseReportCSV(activeMonth, monthExpenses, membersNameMap, settings);
    success('Expense report CSV downloaded');
  };

  return (
    <div className="space-y-5">
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
            {memberSummaries.length} members • {activeMonth.isClosed ? 'Closed period' : 'Active period'}
          </p>
        </div>

        {/* Action Buttons: 1 Primary (+ Meal) and 2 Secondary */}
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

      {/* COMPACT SUMMARY: Meals, Meal Rate, Expenses, Balance */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
          <div className="pt-2 sm:pt-0 sm:px-2 first:pt-0 first:px-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Meals
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {totalMeals}
            </span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Meal Rate
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(currentMealRate, settings.currencySymbol)}
            </span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Expenses
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(totalExpenses, settings.currencySymbol)}
            </span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
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

      {/* MEMBER SUMMARY TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Current Month
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
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-4">Member</th>
                    <th className="py-2.5 px-3 text-right">Meals</th>
                    <th className="py-2.5 px-3 text-right">Cost</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {memberSummaries.map((m) => {
                    // Net balance for this member: money paid minus their total share of costs
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

            {/* Mobile Compact Cards */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {memberSummaries.map((m) => {
                const diff = m.totalPaid - m.totalPayable;
                return (
                  <div key={m.member.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {m.member.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {m.totalMeals} meals • Cost: {formatCurrency(m.totalPayable, settings.currencySymbol)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-mono">
                        Paid: {formatCurrency(m.totalPaid, settings.currencySymbol)}
                      </span>
                      <span className="font-mono font-bold">
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
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* OPTIONAL MINIMAL SPENDING TREND */}
      {monthExpenses.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Spending Overview</span>
            </span>
            <button
              onClick={() => setShowChart(!showChart)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              {showChart ? 'Hide chart' : 'Show chart'}
            </button>
          </div>

          {showChart && (
            <div className="pt-2">
              <SpendingTrendChart
                expenses={monthExpenses}
                currencySymbol={settings.currencySymbol}
                monthName={activeMonth.name}
              />
            </div>
          )}
        </div>
      )}

      {/* FOOTER ACTIONS: EXPORT & INSTALL */}
      <div className="flex items-center justify-between gap-3 text-xs pt-2 text-slate-500 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadSummary}
            className="hover:text-blue-600 flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Settlement (CSV)</span>
          </button>
          <span>•</span>
          <button
            onClick={handleDownloadExpenses}
            className="hover:text-blue-600 flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Expenses (CSV)</span>
          </button>
        </div>

        <button
          onClick={() => setIsInstallModalOpen(true)}
          className="text-blue-600 hover:underline cursor-pointer font-medium"
        >
          Install App
        </button>
      </div>

      <AppInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
