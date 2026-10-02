import React, { useState } from 'react';
import {
  Target,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Edit2,
  Plus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Month, Expense } from '../../types';
import { calculateBudgetAnalysis, formatCurrency } from '../../utils/calculations';
import { SetBudgetModal } from './SetBudgetModal';

interface BudgetTrackerCardProps {
  month: Month;
  expenses: Expense[];
  currencySymbol: string;
  totalExpenses: number;
  onSetBudget: (monthId: string, budget: number | undefined) => Promise<void>;
  compact?: boolean;
}

export const BudgetTrackerCard: React.FC<BudgetTrackerCardProps> = ({
  month,
  expenses,
  currencySymbol,
  totalExpenses,
  onSetBudget,
  compact = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const budgetAnalysis = calculateBudgetAnalysis(
    month,
    totalExpenses,
    expenses,
    currencySymbol
  );

  const {
    hasBudget,
    targetBudget,
    totalSpent,
    remainingBudget,
    percentSpent,
    daysInMonth,
    elapsedDays,
    remainingDays,
    dailyAverage,
    recommendedDailyRemaining,
    projectedTotalSpend,
    projectedPercent,
    isOverBudget,
    isTrendingOverBudget,
    status,
    warningMessage,
    adviceMessage,
  } = budgetAnalysis;

  // Day progress percentage (e.g., day 15 of 30 = 50%)
  const dayProgressPercent = Math.min(100, Math.round((elapsedDays / daysInMonth) * 100));

  // If user hasn't set a budget yet
  if (!hasBudget) {
    if (compact) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>No monthly expense target set.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-lg hover:bg-blue-100 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Budget</span>
          </button>

          <SetBudgetModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            month={month}
            currencySymbol={currencySymbol}
            onSaveBudget={onSetBudget}
          />
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Monthly Budget Tracking
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                  Not Set
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                Set a monthly expense target for <span className="font-medium text-slate-700 dark:text-slate-300">{month.name}</span>.
                MessMate tracks your daily bazaar runs and alerts you when daily spending trends suggest exceeding that budget.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Set Target Budget</span>
          </button>
        </div>

        <SetBudgetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          month={month}
          currencySymbol={currencySymbol}
          onSaveBudget={onSetBudget}
        />
      </div>
    );
  }

  // Color schemes based on status
  const statusConfig = {
    danger: {
      badgeClass: 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300/50 dark:border-rose-900',
      badgeLabel: 'Budget Exceeded',
      badgeIcon: AlertCircle,
      bannerClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200',
      bannerIcon: AlertCircle,
      progressClass: 'bg-rose-600',
      projectedTextClass: 'text-rose-600 dark:text-rose-400 font-bold',
    },
    warning: {
      badgeClass: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300/50 dark:border-amber-900',
      badgeLabel: 'Pace Warning: Exceeds Budget',
      badgeIcon: AlertTriangle,
      bannerClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200',
      bannerIcon: AlertTriangle,
      progressClass: 'bg-amber-500',
      projectedTextClass: 'text-amber-600 dark:text-amber-400 font-bold',
    },
    good: {
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300/50 dark:border-emerald-900',
      badgeLabel: 'On Track',
      badgeIcon: CheckCircle2,
      bannerClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200',
      bannerIcon: CheckCircle2,
      progressClass: 'bg-emerald-600',
      projectedTextClass: 'text-emerald-600 dark:text-emerald-400 font-bold',
    },
    none: {
      badgeClass: 'bg-slate-100 text-slate-800',
      badgeLabel: 'Budget Active',
      badgeIcon: Target,
      bannerClass: 'bg-slate-50 border-slate-200 text-slate-800',
      bannerIcon: Target,
      progressClass: 'bg-blue-600',
      projectedTextClass: 'text-slate-700',
    },
  }[status];

  const StatusIcon = statusConfig.badgeIcon;
  const BannerIcon = statusConfig.bannerIcon;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Monthly Expense Budget
              </h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.badgeClass}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusConfig.badgeLabel}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Day {elapsedDays} of {daysInMonth} ({remainingDays} days remaining)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Target ({formatCurrency(targetBudget, currencySymbol)})</span>
        </button>
      </div>

      {/* Prominent Warning or Advice Banner */}
      {(isOverBudget || isTrendingOverBudget) && (
        <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${statusConfig.bannerClass}`}>
          <div className="p-1 rounded-lg bg-white/60 dark:bg-black/20 shrink-0 mt-0.5">
            <BannerIcon className="w-5 h-5 shrink-0" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-sm tracking-tight">
              {warningMessage}
            </h4>
            <p className="leading-relaxed opacity-95">
              {adviceMessage}
            </p>
          </div>
        </div>
      )}

      {/* Visual Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-900 dark:text-white">
            Spent: {formatCurrency(totalSpent, currencySymbol)}{' '}
            <span className="text-slate-500 font-normal">
              ({percentSpent}% of {formatCurrency(targetBudget, currencySymbol)})
            </span>
          </span>
          <span className={`font-mono text-xs font-semibold ${remainingBudget < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
            {remainingBudget < 0
              ? `-${formatCurrency(Math.abs(remainingBudget), currencySymbol)} over`
              : `${formatCurrency(remainingBudget, currencySymbol)} left`}
          </span>
        </div>

        {/* Bar container with day elapsed reference tick */}
        <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          {/* Main filled progress bar */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${statusConfig.progressClass}`}
            style={{ width: `${Math.min(100, Math.max(0, percentSpent))}%` }}
          />
        </div>

        {/* Context caption showing pace comparison */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span>
            {dayProgressPercent}% of month elapsed
          </span>
          {percentSpent > dayProgressPercent ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Spending {Math.round(percentSpent - dayProgressPercent)}% faster than calendar pace
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Spending below calendar pace
            </span>
          )}
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
            Target Budget
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(targetBudget, currencySymbol)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">For {month.name}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
            Daily Average Pace
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(dailyAverage, currencySymbol)}
            <span className="text-xs text-slate-500 font-normal">/day</span>
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Over {elapsedDays} days</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
            Projected Spend
          </span>
          <span className={`text-base sm:text-lg font-mono tabular-nums ${statusConfig.projectedTextClass}`}>
            {formatCurrency(projectedTotalSpend, currencySymbol)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {projectedPercent}% of target
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
            Safe Daily Allowance
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(recommendedDailyRemaining, currencySymbol)}
            <span className="text-xs text-slate-500 font-normal">/day</span>
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {remainingDays > 0 ? `For next ${remainingDays} days` : 'Month ended'}
          </span>
        </div>
      </div>

      <SetBudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        month={month}
        currencySymbol={currencySymbol}
        onSaveBudget={onSetBudget}
      />
    </div>
  );
};
