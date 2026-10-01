import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Payment, PaymentMethod } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { NavTab } from '../components/layout/AppLayout';

interface PaymentsPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ onNavigate }) => {
  const {
    activeMonth,
    members,
    payments,
    settings,
    addPayment,
    updatePayment,
    deletePayment,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Form State
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [note, setNote] = useState('');

  const monthMembers = useMemo(() => {
    if (!activeMonth) return [];
    return members.filter((m) => {
      if (activeMonth.memberIds?.length) return activeMonth.memberIds.includes(m.id);
      return m.status === 'active';
    });
  }, [activeMonth, members]);

  const monthPayments = useMemo(() => {
    if (!activeMonth) return [];
    return payments.filter((p) => p.monthId === activeMonth.id);
  }, [payments, activeMonth]);

  const filteredPayments = useMemo(() => {
    return monthPayments
      .filter((p) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const mem = members.find((m) => m.id === p.memberId);
          const matchName = mem?.name.toLowerCase().includes(q);
          const matchMethod = p.method.toLowerCase().includes(q);
          const matchNote = p.note?.toLowerCase().includes(q);
          if (!matchName && !matchMethod && !matchNote) return false;
        }
        if (memberFilter !== 'all' && p.memberId !== memberFilter) return false;
        if (methodFilter !== 'all' && p.method !== methodFilter) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [monthPayments, searchQuery, memberFilter, methodFilter, members]);

  // Total collected & by member
  const totalCollected = useMemo(() => {
    return monthPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [monthPayments]);

  const memberPaymentsSummary = useMemo(() => {
    const map: Record<string, number> = {};
    monthMembers.forEach((m) => {
      map[m.id] = 0;
    });
    monthPayments.forEach((p) => {
      map[p.memberId] = (map[p.memberId] || 0) + p.amount;
    });
    return map;
  }, [monthMembers, monthPayments]);

  const handleOpenAdd = () => {
    setEditingPayment(null);
    setMemberId(monthMembers[0]?.id || '');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setMethod('Cash');
    setNote('');
    setShowMoreOptions(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Payment) => {
    setEditingPayment(p);
    setMemberId(p.memberId);
    setAmount(String(p.amount));
    setDate(p.date);
    setMethod(p.method);
    setNote(p.note || '');
    setShowMoreOptions(Boolean(p.note));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!memberId) return;

    if (editingPayment) {
      await updatePayment({
        ...editingPayment,
        memberId,
        amount: numAmount,
        date,
        method,
        note: note.trim() || undefined,
      });
    } else {
      await addPayment({
        memberId,
        amount: numAmount,
        date,
        method,
        note: note.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  if (!activeMonth) {
    return (
      <div className="py-12 text-center max-w-md mx-auto">
        <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">No active month</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">Select or create a month to record deposits.</p>
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
            Payments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {monthPayments.length} deposits recorded • {activeMonth.name}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          disabled={activeMonth.isClosed || monthMembers.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Payment</span>
        </button>
      </div>

      {/* Compact Total Deposits Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Total Deposits Collected
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(totalCollected, settings.currencySymbol)}
            </span>
          </div>

          {/* Member breakdown pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full">
            {monthMembers.map((m) => (
              <div
                key={m.id}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs shrink-0"
              >
                <span className="text-slate-500 text-[10px] block">{m.name}</span>
                <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                  {formatCurrency(memberPaymentsSummary[m.id] || 0, settings.currencySymbol)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="all">All Members</option>
            {monthMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="all">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="bKash">bKash</option>
            <option value="Nagad">Nagad</option>
            <option value="Bank">Bank</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Payment Records List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <CreditCard className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No payments recorded yet
            </p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Record deposits and installments paid by borders.
            </p>
            <button
              onClick={handleOpenAdd}
              disabled={activeMonth.isClosed}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Record First Payment
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
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-5 text-right">Amount</th>
                    <th className="py-3 px-4 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPayments.map((p) => {
                    const member = members.find((m) => m.id === p.memberId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {p.date}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                            {member?.name.charAt(0).toUpperCase() || 'M'}
                          </div>
                          <span>{member?.name || 'Unknown'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {p.method}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                          {p.note || '—'}
                        </td>
                        <td className="py-3.5 px-5 text-right font-black text-slate-900 dark:text-white">
                          {formatCurrency(p.amount, settings.currencySymbol)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              disabled={activeMonth.isClosed}
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(p.id)}
                              disabled={activeMonth.isClosed}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.map((p) => {
                const member = members.find((m) => m.id === p.memberId);
                return (
                  <div key={p.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                          {member?.name.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {member?.name || 'Unknown'}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono">{p.date}</span>
                        </div>
                      </div>
                      <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.amount, settings.currencySymbol)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {p.method}
                        </span>
                        {p.note && <span className="text-slate-400 italic">"{p.note}"</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          disabled={activeMonth.isClosed}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(p.id)}
                          disabled={activeMonth.isClosed}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPayment ? 'Edit Payment' : 'Add Payment'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Member */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Member *
            </label>
            <select
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden"
              autoFocus
            >
              {monthMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

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

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Method *
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden"
            >
              <option value="Cash">Cash</option>
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
              <option value="Bank">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* "More options" Disclosure Toggle for Note */}
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
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. advance deposit, TrxID: 9X32AB"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden"
                />
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
              {editingPayment ? 'Save Changes' : 'Add Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) {
            await deletePayment(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Payment"
        message="Are you sure you want to remove this payment record? The member balance will recalculate immediately."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};
