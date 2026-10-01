import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Utensils,
  CreditCard,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Member } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { NavTab } from '../components/layout/AppLayout';

interface MembersPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const MembersPage: React.FC<MembersPageProps> = ({ onNavigate }) => {
  const {
    members,
    activeMonth,
    summary,
    settings,
    addMember,
    updateMember,
    toggleMemberStatus,
    deleteMember,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingMember(null);
    setName('');
    setPhone('');
    setJoinDate(new Date().toISOString().slice(0, 10));
    setStatus('active');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setName(member.name);
    setPhone(member.phone || '');
    setJoinDate(member.joinDate);
    setStatus(member.status);
    setNotes(member.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingMember) {
      await updateMember({
        ...editingMember,
        name: name.trim(),
        phone: phone.trim() || undefined,
        joinDate,
        status,
        notes: notes.trim() || undefined,
      });
    } else {
      await addMember({
        name: name.trim(),
        phone: phone.trim() || undefined,
        joinDate,
        status,
        notes: notes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const memberStatsMap = useMemo(() => {
    const map = new Map<string, typeof summary.memberSummaries[0]>();
    summary.memberSummaries.forEach((s) => {
      map.set(s.member.id, s);
    });
    return map;
  }, [summary.memberSummaries]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Members
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {members.length} members ({members.filter(m => m.status === 'active').length} active)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center max-w-sm mx-auto space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Members Yet</p>
          <p className="text-xs text-slate-500">
            Add roommates living in this mess to begin tracking their meals and expenses.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((member) => {
            const stats = memberStatsMap.get(member.id);
            const isActive = member.status === 'active';

            return (
              <div
                key={member.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-2xs transition flex flex-col justify-between ${
                  isActive
                    ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    : 'border-slate-200/60 dark:border-slate-800/60 opacity-60 bg-slate-50/50'
                }`}
              >
                <div>
                  {/* Top line with Avatar and Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                          {member.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          {member.phone ? (
                            <span>{member.phone}</span>
                          ) : (
                            <span className="text-[11px]">No phone</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleMemberStatus(member.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                      title="Click to toggle status"
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Joined Date & Notes */}
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-400">
                    <span>Joined: {member.joinDate}</span>
                    {member.notes && (
                      <p className="italic text-slate-500 line-clamp-1 mt-0.5">"{member.notes}"</p>
                    )}
                  </div>

                  {/* Current Active Month Metrics */}
                  {stats && (
                    <div className="mt-2.5 grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Meals</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                          {stats.totalMeals}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Paid</span>
                        <span className="font-semibold font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                          {formatCurrency(stats.totalPaid, settings.currencySymbol)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Balance</span>
                        <span
                          className={`font-semibold font-mono tabular-nums ${
                            stats.status === 'due'
                              ? 'text-rose-600 dark:text-rose-400'
                              : stats.status === 'receivable'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {stats.status === 'receivable' ? '+' : ''}
                          {formatCurrency(stats.balance, settings.currencySymbol)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setViewingMember(member)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
                  >
                    View Details
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(member.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Remove Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member Details Modal */}
      {viewingMember && (
        <Modal
          isOpen={!!viewingMember}
          onClose={() => setViewingMember(null)}
          title={`Member Profile: ${viewingMember.name}`}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Phone:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {viewingMember.phone || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Join Date:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {viewingMember.joinDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Status:</span>
                <span className="font-semibold capitalize text-emerald-600">
                  {viewingMember.status}
                </span>
              </div>
              {viewingMember.notes && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-xs block mb-1">Notes:</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                    {viewingMember.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Current month stats */}
            {memberStatsMap.get(viewingMember.id) && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Current Month ({activeMonth?.name})
                </h4>
                {(() => {
                  const s = memberStatsMap.get(viewingMember.id)!;
                  return (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Meals Count:</span>
                        <span className="font-bold">{s.totalMeals} meals</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Food Cost:</span>
                        <span className="font-semibold">
                          {formatCurrency(s.foodCost, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Shared Expenses:</span>
                        <span className="font-semibold">
                          {formatCurrency(s.sharedCost, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Payable:</span>
                        <span className="font-bold">
                          {formatCurrency(s.totalPayable, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Deposits / Paid:</span>
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(s.totalPaid, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 font-bold">
                        <span>Current Balance:</span>
                        <span
                          className={
                            s.status === 'due'
                              ? 'text-rose-600'
                              : s.status === 'receivable'
                              ? 'text-teal-600'
                              : 'text-slate-600'
                          }
                        >
                          {formatCurrency(s.balance, settings.currencySymbol)} ({s.status})
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <button
              onClick={() => setViewingMember(null)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? 'Edit Member' : 'Add Member'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Member Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ismail Hossain"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                placeholder="017xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Join Date *
              </label>
              <input
                type="date"
                required
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden"
            >
              <option value="active">Active (Eats meals &amp; shares costs)</option>
              <option value="inactive">Inactive (Left mess or temporarily absent)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Room 302, Manager notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden"
            />
          </div>

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
              {editingMember ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) {
            await deleteMember(deletingId);
            setDeletingId(null);
          }
        }}
        title="Remove Member"
        message="If this member has past recorded meals or payments, they will be marked as inactive rather than permanently deleted so historical settlements remain 100% accurate."
        confirmLabel="Remove"
        isDestructive={true}
      />
    </div>
  );
};
