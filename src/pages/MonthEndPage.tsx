import React, { useState } from 'react';
import {
  CalendarCheck,
  Printer,
  Lock,
  Unlock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Receipt,
  Utensils,
  Share2,
  DollarSign,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/calculations';
import { NavTab } from '../components/layout/AppLayout';
import { generateMonthSummaryCSV } from '../utils/exportUtils';
import { useToast } from '../context/ToastContext';

interface MonthEndPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const MonthEndPage: React.FC<MonthEndPageProps> = ({ onNavigate }) => {
  const {
    activeMonth,
    summary,
    settlementTransactions,
    settings,
    toggleMonthClose,
  } = useApp();
  const { success } = useToast();

  if (!activeMonth) {
    return (
      <div className="py-12 text-center max-w-md mx-auto">
        <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">No active month</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">Select or create a month to view final settlements.</p>
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
    totalMealExpenses,
    currentMealRate,
    totalSharedExpenses,
    totalExpenses,
    totalPayments,
    totalOutstandingDue,
    totalReceivable,
    memberSummaries,
  } = summary;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    if (!activeMonth) return;
    generateMonthSummaryCSV(activeMonth, summary, settings);
    success('Settlement CSV downloaded');
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-slate-800 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {activeMonth.name} Settlement
            </h1>
            {activeMonth.isClosed ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Closed
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                Active Period
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Final month reconciliation and member balances
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print</span>
          </button>
          <button
            onClick={() => toggleMonthClose(activeMonth.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-white shadow-xs ${
              activeMonth.isClosed
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {activeMonth.isClosed ? (
              <>
                <Unlock className="w-3.5 h-3.5" /> Reopen Month
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" /> Close Month
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Financial Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800">
          {/* Total Meals */}
          <div className="pt-2 sm:pt-0 sm:pr-2 first:pt-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Total Meals
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {totalMeals}
            </span>
          </div>

          {/* Total Meal Expenses */}
          <div className="pt-2 sm:pt-0 sm:px-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Meal Expenses
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(totalMealExpenses, settings.currencySymbol)}
            </span>
          </div>

          {/* Final Meal Rate */}
          <div className="pt-2 sm:pt-0 sm:px-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Meal Rate
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
              {formatCurrency(currentMealRate, settings.currencySymbol)}
            </span>
          </div>

          {/* Total Shared Expenses */}
          <div className="pt-2 sm:pt-0 sm:px-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Shared Expenses
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
              {formatCurrency(totalSharedExpenses, settings.currencySymbol)}
            </span>
          </div>

          {/* Total Payments */}
          <div className="pt-2 sm:pt-0 sm:px-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Total Payments
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(totalPayments, settings.currencySymbol)}
            </span>
          </div>

          {/* Net Settlement Balance */}
          <div className="pt-2 sm:pt-0 sm:pl-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Net Balance
            </span>
            <span
              className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
                totalPayments - totalExpenses >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {totalPayments - totalExpenses >= 0 ? '+' : ''}
              {formatCurrency(totalPayments - totalExpenses, settings.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Member Settlement Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Member Settlement
          </h2>
        </div>

        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-4">Member</th>
                <th className="py-2.5 px-3 text-right">Total Meals</th>
                <th className="py-2.5 px-3 text-right">Food Cost</th>
                <th className="py-2.5 px-3 text-right">Shared Share</th>
                <th className="py-2.5 px-3 text-right">Total Payable</th>
                <th className="py-2.5 px-3 text-right">Paid Amount</th>
                <th className="py-2.5 px-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {memberSummaries.map((m) => (
                <tr key={m.member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {m.member.name}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300 tabular-nums">
                    {m.totalMeals}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(m.foodCost, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {formatCurrency(m.sharedCost, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(m.totalPayable, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                    {formatCurrency(m.totalPaid, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold font-mono tabular-nums">
                    {m.status === 'due' && (
                      <span className="text-rose-600 dark:text-rose-400">
                        Owes {formatCurrency(m.balance, settings.currencySymbol)}
                      </span>
                    )}
                    {m.status === 'receivable' && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Receives {formatCurrency(Math.abs(m.balance), settings.currencySymbol)}
                      </span>
                    )}
                    {m.status === 'settled' && (
                      <span className="text-slate-400">
                        Settled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: High-clarity Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {memberSummaries.map((m) => (
            <div key={m.member.id} className="p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {m.member.name}
                </span>
                <span className="font-semibold font-mono text-xs">
                  {m.status === 'due' && (
                    <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                      Owes {formatCurrency(m.balance, settings.currencySymbol)}
                    </span>
                  )}
                  {m.status === 'receivable' && (
                    <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                      Receives {formatCurrency(Math.abs(m.balance), settings.currencySymbol)}
                    </span>
                  )}
                  {m.status === 'settled' && (
                    <span className="text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      Settled
                    </span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Meals &amp; Food Cost:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {m.totalMeals} meals • {formatCurrency(m.foodCost, settings.currencySymbol)}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Shared Expense Share:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatCurrency(m.sharedCost, settings.currencySymbol)}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Total Payable:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {formatCurrency(m.totalPayable, settings.currencySymbol)}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Paid Amount:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {formatCurrency(m.totalPaid, settings.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simplified Peer-to-Peer Settlement */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
          Settlement Plan
        </h3>

        {settlementTransactions.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            All accounts are settled. No transfers required.
          </p>
        ) : (
          <div className="space-y-2">
            {settlementTransactions.map((tx, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {tx.fromMemberName}
                  </span>
                  <span className="text-slate-400">pays</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {tx.toMemberName}
                  </span>
                </div>

                <span className="font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(tx.amount, settings.currencySymbol)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
