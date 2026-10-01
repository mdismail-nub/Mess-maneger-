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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseType, SharedExpenseSplitMethod } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
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
  } = useApp();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ExpenseType>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

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
    setShowMoreOptions(false);
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
    setShowMoreOptions(Boolean(exp.note || (exp.type === 'shared' && exp.splitMethod !== 'equal')));
    setIsModalOpen(true);
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
      });
    }

    setIsModalOpen(false);
  };

  const totalMealAmount = monthExpenses
    .filter((e) => e.type === 'meal')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSharedAmount = monthExpenses
    .filter((e) => e.type === 'shared')
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
            onChange={(e) => setTypeFilter(e.target.value as 'all' | ExpenseType)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="all">All Types</option>
            <option value="meal">Meal Expenses</option>
            <option value="shared">Shared Expenses</option>
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
                          {exp.type === 'meal' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                              <Utensils className="w-3 h-3" /> Meal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
                              <Share2 className="w-3 h-3" /> Shared ({exp.splitMethod})
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
                        {exp.type === 'meal' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                            Meal Expense
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
                            Shared ({exp.splitMethod})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(exp)}
                          disabled={activeMonth.isClosed}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(exp.id)}
                          disabled={activeMonth.isClosed}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
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
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Amount & Date */}
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
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500"
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

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rice, Chicken, Oil, Electricity"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Paid By & Category */}
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
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden"
              >
                {settings.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('meal')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-left transition cursor-pointer ${
                  type === 'meal'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Meal Expense
                <span className="block text-[10px] text-slate-400 font-normal">Calculates into meal rate</span>
              </button>

              <button
                type="button"
                onClick={() => setType('shared')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-left transition cursor-pointer ${
                  type === 'shared'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Shared Expense
                <span className="block text-[10px] text-slate-400 font-normal">Gas, wifi, cleaning, etc.</span>
              </button>
            </div>
          </div>

          {/* "More options" Disclosure Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer"
            >
              {showMoreOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showMoreOptions ? 'Fewer options' : 'More options'}</span>
            </button>

            {showMoreOptions && (
              <div className="mt-3 space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                {/* Note */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. bought from market, receipt details"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden"
                  />
                </div>

                {/* If Shared Expense: Choose Split Method */}
                {type === 'shared' && (
                  <div className="space-y-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Shared Split Method:
                    </label>
                    <select
                      value={splitMethod}
                      onChange={(e) => setSplitMethod(e.target.value as SharedExpenseSplitMethod)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="equal">Equal Split (Split equally across all members)</option>
                      <option value="meal_based">Meal-Based Split (Proportional to meals eaten)</option>
                      <option value="custom">Custom Split (Enter individual amounts)</option>
                    </select>

                    {splitMethod === 'custom' && (
                      <div className="space-y-1.5 pt-1.5">
                        <span className="text-[11px] text-slate-500 block">
                          Enter exact share ({settings.currencySymbol}):
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {monthMembers.map((m) => (
                            <div key={m.id} className="flex items-center gap-2">
                              <span className="text-xs text-slate-600 dark:text-slate-400 w-20 truncate">
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
                                className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
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
              className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
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
