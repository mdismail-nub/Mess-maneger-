import React, { useState, useEffect } from 'react';
import { Target, Trash2, Check, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Month } from '../../types';

interface SetBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: Month | null;
  currencySymbol: string;
  onSaveBudget: (monthId: string, budget: number | undefined) => Promise<void>;
}

export const SetBudgetModal: React.FC<SetBudgetModalProps> = ({
  isOpen,
  onClose,
  month,
  currencySymbol,
  onSaveBudget,
}) => {
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (month?.budget) {
      setBudgetInput(String(month.budget));
    } else {
      setBudgetInput('');
    }
  }, [month, isOpen]);

  if (!month) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(budgetInput);
    setIsSubmitting(true);
    try {
      if (isNaN(val) || val <= 0) {
        await onSaveBudget(month.id, undefined);
      } else {
        await onSaveBudget(month.id, val);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    setIsSubmitting(true);
    try {
      await onSaveBudget(month.id, undefined);
      setBudgetInput('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const presets = [5000, 8000, 10000, 12000, 15000, 20000];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={month.budget ? 'Edit Monthly Budget' : 'Set Monthly Budget'}
      subtitle={`Configure monthly expense target for ${month.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Setting a monthly target lets MessMate continuously monitor your daily spending trends.
            You'll receive early warnings whenever your daily bazaar run pace suggests exceeding this target.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Target Expense Budget ({currencySymbol}) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
              {currencySymbol}
            </span>
            <input
              type="number"
              step="any"
              min="1"
              required
              placeholder="e.g. 10000"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Covers all bazaar expenses (meal + shared costs) for {month.name}.
          </span>
        </div>

        {/* Quick presets */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Quick Suggestions:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setBudgetInput(String(amt))}
                className={`px-2.5 py-1 text-xs rounded-lg border font-mono transition cursor-pointer ${
                  budgetInput === String(amt)
                    ? 'bg-blue-600 border-blue-600 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {currencySymbol}{amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          {month.budget ? (
            <button
              type="button"
              onClick={handleClear}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Budget</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !budgetInput.trim() || parseFloat(budgetInput) <= 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Budget</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
