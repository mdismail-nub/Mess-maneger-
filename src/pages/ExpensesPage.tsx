import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Receipt,
  Edit2,
  Trash2,
  PieChart,
  Calendar,
  Utensils,
  Share2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  Home,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseType, SharedExpenseSplitMethod } from '../types';
import { formatCurrency, autoDetectExpenseType, isMealExpense, isSharedExpense } from '../utils/calculations';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { BudgetTrackerCard } from '../components/budget/BudgetTrackerCard';
import { NavTab } from '../components/layout/AppLayout';

interface ExpensesPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({ onNavigate }) => {
  const {
    activeMonth,
    members,
    expenses,
    settings,
    addExpense,
    updateExpense,
    deleteExpense,
    setMonthBudget,
  } = useApp();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ExpenseType | 'needsReview'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userManuallySetType, setUserManuallySetType] = useState(false);
  const [autoDetectedReason, setAutoDetectedReason] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('Meat');
  const [paidByMemberId, setPaidByMemberId] = useState('');
  const [type, setType] = useState<ExpenseType>('meal');
  const [splitMethod, setSplitMethod] = useState<SharedExpenseSplitMethod>('equal');
  const [customShares, setCustomShares] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');

  // Active members for this month
  const monthMembers = useMemo(() => {
    if (!activeMonth) return [];
    return members.filter((m) => {
      if (activeMonth.memberIds?.length) return activeMonth.memberIds.includes(m.id);
      return m.status === 'active';
    });
  }, [activeMonth, members]);

  // Expenses for active month
  const monthExpenses = useMemo(() => {
    if (!activeMonth) return [];
    return expenses.filter((e) => e.monthId === activeMonth.id);
  }, [expenses, activeMonth]);

  // Expenses needing classification review
  const expensesNeedingReview = useMemo(() => {
    return monthExpenses.filter((e) => e.needsReview === true);
  }, [monthExpenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return monthExpenses
      .filter((e) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = e.title.toLowerCase().includes(q);
          const matchCategory = e.category.toLowerCase().includes(q);
          const payer = members.find((m) => m.id === e.paidByMemberId);
          const matchPayer = payer?.name.toLowerCase().includes(q);
          if (!matchTitle && !matchCategory && !matchPayer) return false;
        }
        if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
        if (memberFilter !== 'all' && e.paidByMemberId !== memberFilter) return false;
        if (typeFilter === 'needsReview') return e.needsReview === true;
        if (typeFilter !== 'all' && e.type !== typeFilter) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [monthExpenses, searchQuery, categoryFilter, memberFilter, typeFilter, members]);

  // Category breakdown
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [monthExpenses]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingExpense(null);
    setTitle('');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setCategory(settings.categories[0] || 'Grocery');
    setPaidByMemberId(monthMembers[0]?.id || '');
    setType('meal');
    setSplitMethod('equal');
    setCustomShares({});
    setNote('');
    setUserManuallySetType(false);
    setAutoDetectedReason(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setAmount(String(exp.amount));
    setDate(exp.date);
    setCategory(exp.category);
    setPaidByMemberId(exp.paidByMemberId);
    setType(exp.type);
    setSplitMethod(exp.splitMethod || 'equal');
    setCustomShares(exp.customShares || {});
    setNote(exp.note || '');
    setUserManuallySetType(true);
    setAutoDetectedReason(null);
    setIsModalOpen(true);
  };

  // Handle typing title with auto-detection
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!userManuallySetType && !editingExpense) {
      const detected = autoDetectExpenseType(newTitle, category);
      if (detected.isConfident) {
        setType(detected.type);
        setAutoDetectedReason(detected.reason);
      }
    }
  };

  // Handle category change with auto-detection
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    if (!userManuallySetType && !editingExpense) {
      const detected = autoDetectExpenseType(title, newCategory);
      if (detected.isConfident) {
        setType(detected.type);
        setAutoDetectedReason(detected.reason);
      }
    }
  };

  // Quick classify handler for unclassified items
  const handleQuickClassify = async (exp: Expense, targetType: ExpenseType) => {
    await updateExpense({
      ...exp,
      type: targetType,
      splitMethod: targetType === 'shared' ? (exp.splitMethod || 'equal') : undefined,
      needsReview: false,
    });
  };

  // Save Expense Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!paidByMemberId) return;

    if (editingExpense) {
      await updateExpense({
        ...editingExpense,
        title: title.trim(),
        amount: numAmount,
        date,
        category,
        paidByMemberId,
        type,
        splitMethod: type === 'shared' ? splitMethod : undefined,
        customShares: type === 'shared' && splitMethod === 'custom' ? customShares : undefined,
        note: note.trim() || undefined,
        needsReview: false,
      });
    } else {
      await addExpense({
        title: title.trim(),
        amount: numAmount,
        date,
        category,
        paidByMemberId,
        type,
        splitMethod: type === 'shared' ? splitMethod : undefined,
        customShares: type === 'shared' && splitMethod === 'custom' ? customShares : undefined,
        note: note.trim() || undefined,
        needsReview: false,
      });
    }

    setIsModalOpen(false);
  };

  const totalMealAmount = monthExpenses
    .filter((e) => isMealExpense(e))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSharedAmount = monthExpenses
    .filter((e) => isSharedExpense(e))
    .reduce((sum, e) => sum + e.amount, 0);

  if (!activeMonth) {
    return (
      <div className="py-12 text-center max-w-md mx-auto">
        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">No active month</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">Select or create a month to manage market expenses.</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Expenses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {monthExpenses.length} records • {activeMonth.name}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          disabled={activeMonth.isClosed || monthMembers.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Compact Summary: Total Expenses, Meal Expenses, Shared Expenses */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        <div className="grid grid-cols-3 gap-3 divide-x divide-slate-100 dark:divide-slate-800">
          <div className="pr-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Total Expenses
            </span>
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(totalMealAmount + totalSharedAmount, settings.currencySymbol)}
            </span>
          </div>

          <div className="px-3">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Meal Expenses
            </span>
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(totalMealAmount, settings.currencySymbol)}
            </span>
          </div>

          <div className="pl-3">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Shared Expenses
            </span>
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(totalSharedAmount, settings.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Budget & Daily Trend Warning */}
      <BudgetTrackerCard
        month={activeMonth}
        expenses={monthExpenses}
        currencySymbol={settings.currencySymbol}
        totalExpenses={totalMealAmount + totalSharedAmount}
        onSetBudget={setMonthBudget}
      />

      {/* Classification Review Banner for Unclassified / Ambiguous Expenses */}
      {expensesNeedingReview.length > 0 && (
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700/60 p-4 rounded-xl space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {expensesNeedingReview.length} Expense{expensesNeedingReview.length > 1 ? 's' : ''} Need Classification
            </span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            Please confirm whether each recorded expense is directly for <strong>Meals</strong> (Rice, Vegetables, Meat, Oil - contributes to meal rate) or a <strong>Shared Expense</strong> (Wi-Fi, Electricity, Gas, Rent - excluded from meal rate):
          </p>
          <div className="space-y-2 pt-1">
            {expensesNeedingReview.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 text-xs gap-3"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</span>
                  <div className="flex items-center gap-2 text-slate-500 mt-0.5 text-[11px]">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(item.amount, settings.currencySymbol)}
                    </span>
                    <span>•</span>
                    <span>{item.date}</span>
                    <span>•</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                      Category: {item.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickClassify(item, 'meal')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-xs"
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Meal Expense (In Rate)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickClassify(item, 'shared')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Shared Expense (Excluded)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            {settings.categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Member Filter */}
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="all">Paid by: Anyone</option>
            {monthMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | ExpenseType | 'needsReview')}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="all">All Expense Types</option>
            <option value="meal">Meal Expenses (In Meal Rate)</option>
            <option value="shared">Shared Expenses (Excluded from Meal Rate)</option>
            {expensesNeedingReview.length > 0 && (
              <option value="needsReview">⚠️ Needs Review ({expensesNeedingReview.length})</option>
            )}
          </select>
        </div>
      </div>

      {/* Expense List Table / Mobile Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No expenses match your criteria
            </p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Add your first market expense or adjust the active filters.
            </p>
            <button
              onClick={handleOpenAdd}
              disabled={activeMonth.isClosed}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-4">Title &amp; Notes</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Paid By</th>
                    <th className="py-3 px-5 text-right">Amount</th>
                    <th className="py-3 px-4 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredExpenses.map((exp) => {
                    const payer = members.find((m) => m.id === exp.paidByMemberId);
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {exp.date}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          <div>{exp.title}</div>
                          {exp.note && (
                            <span className="text-[11px] text-slate-400 font-normal block truncate max-w-xs">
                              {exp.note}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {exp.needsReview ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 rounded-lg">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Needs Review</span>
                            </span>
                          ) : exp.type === 'meal' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
                              <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Meal Expense</span>
                              <span className="text-[10px] opacity-75 font-normal hidden lg:inline">• In Rate</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-800 px-2.5 py-1 rounded-lg">
                              <Share2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Shared ({exp.splitMethod || 'equal'})</span>
                              <span className="text-[10px] opacity-75 font-normal hidden lg:inline">• Excluded</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {payer?.name || 'Unknown'}
                        </td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(exp.amount, settings.currencySymbol)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(exp)}
                              disabled={activeMonth.isClosed}
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-30"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(exp.id)}
                              disabled={activeMonth.isClosed}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-30"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((exp) => {
                const payer = members.find((m) => m.id === exp.paidByMemberId);
                return (
                  <div key={exp.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {exp.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{exp.date}</span>
                          <span>•</span>
                          <span>{exp.category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-base text-slate-900 dark:text-white block">
                          {formatCurrency(exp.amount, settings.currencySymbol)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Paid by {payer?.name || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        {exp.needsReview ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-md">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Needs Review
                          </span>
                        ) : exp.type === 'meal' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                            <Utensils className="w-3 h-3 text-emerald-600" />
                            <span>Meal Expense</span>
                            <span className="text-[10px] opacity-75 font-normal">• In Rate</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-800 px-2 py-0.5 rounded-md">
                            <Share2 className="w-3 h-3 text-blue-600" />
                            <span>Shared ({exp.splitMethod || 'equal'})</span>
                            <span className="text-[10px] opacity-75 font-normal">• Excluded</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(exp)}
                          disabled={activeMonth.isClosed}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(exp.id)}
                          disabled={activeMonth.isClosed}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        subtitle={activeMonth.name}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. EXPENSE TYPE SELECTION (Clearly Visible & Required) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Expense Type *
              </label>
              {autoDetectedReason && !userManuallySetType && (
                <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-detected
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Meal Expense Card */}
              <button
                type="button"
                onClick={() => {
                  setType('meal');
                  setUserManuallySetType(true);
                  setAutoDetectedReason(null);
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer relative ${
                  type === 'meal'
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-emerald-600 shrink-0" />
                    Meal Expense
                  </span>
                  {type === 'meal' && (
                    <span className="p-0.5 rounded-full bg-emerald-600 text-white">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-950 dark:text-emerald-200">
                  Food &amp; bazaar items (Rice, Vegetables, Meat, Fish, Oil, Spices)
                </p>
                <div className="mt-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md inline-block">
                  ✓ Included in Meal Rate calculation
                </div>
              </button>

              {/* Shared Expense Card */}
              <button
                type="button"
                onClick={() => {
                  setType('shared');
                  setUserManuallySetType(true);
                  setAutoDetectedReason(null);
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer relative ${
                  type === 'shared'
                    ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-sm text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-blue-600 shrink-0" />
                    Shared Expense
                  </span>
                  {type === 'shared' && (
                    <span className="p-0.5 rounded-full bg-blue-600 text-white">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-blue-950 dark:text-blue-200">
                  Household utility (Wi-Fi, Electricity, Gas, Rent, Water, Cleaning)
                </p>
                <div className="mt-1.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md inline-block">
                  ✓ Separate from Meal Rate (Never affects rate)
                </div>
              </button>
            </div>
          </div>

          {/* 2. IF SHARED EXPENSE: CLEAR SHARING METHOD SELECTOR */}
          {type === 'shared' && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-blue-950 dark:text-blue-200 mb-0.5">
                  Sharing Method *
                </label>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  How should this shared cost be distributed among active members?
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSplitMethod('equal')}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                    splitMethod === 'equal'
                      ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold">Equal Split</span>
                  <span className="text-[10px] opacity-80 block truncate">All {monthMembers.length} members</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitMethod('meal_based')}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                    splitMethod === 'meal_based'
                      ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold">Meal-Based</span>
                  <span className="text-[10px] opacity-80 block truncate">Proportional</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitMethod('custom')}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                    splitMethod === 'custom'
                      ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold">Custom</span>
                  <span className="text-[10px] opacity-80 block truncate">Per person</span>
                </button>
              </div>

              {splitMethod === 'custom' && (
                <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40 space-y-2">
                  <span className="text-[11px] font-semibold text-blue-900 dark:text-blue-200 block">
                    Enter individual share ({settings.currencySymbol}):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {monthMembers.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-20 truncate">
                          {m.name}:
                        </span>
                        <input
                          type="number"
                          step="any"
                          placeholder="0"
                          value={customShares[m.id] ?? ''}
                          onChange={(e) =>
                            setCustomShares({
                              ...customShares,
                              [m.id]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. AMOUNT & DATE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Amount ({settings.currencySymbol}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-semibold"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 4. DESCRIPTION (WIRED WITH SMART DETECTION) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Description / Item Name *
              </label>
              {autoDetectedReason && !userManuallySetType && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400">
                  {autoDetectedReason}
                </span>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Wi-Fi bill, Chicken, Rice, Electricity bill"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* 5. PAID BY & CATEGORY */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Paid By *
              </label>
              <select
                required
                value={paidByMemberId}
                onChange={(e) => setPaidByMemberId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden"
              >
                {monthMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden"
              >
                {settings.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 6. NOTE (OPTIONAL) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. receipt number, store name, notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden"
            />
          </div>

          {/* FORM ACTIONS */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
            >
              {editingExpense ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) {
            await deleteExpense(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? The meal rate and member totals will recalculate automatically."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};
