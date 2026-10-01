import React, { useState } from 'react';
import { Calendar, Plus, CheckCircle, Lock, Unlock } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';

interface MonthSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonthSwitcherModal: React.FC<MonthSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { months, activeMonth, setActiveMonthId, createMonth, toggleMonthClose, members } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [copyMembers, setCopyMembers] = useState(true);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createMonth(name.trim(), startDate, copyMembers);
    setName('');
    setIsCreating(false);
    onClose();
  };

  // Quick helper to suggest next month name
  const handleStartCreate = () => {
    const now = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const suggested = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    setName(suggested);
    setStartDate(now.toISOString().slice(0, 10));
    setIsCreating(true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsCreating(false);
        onClose();
      }}
      title={isCreating ? 'Create New Month' : 'Select Active Month'}
      subtitle={isCreating ? 'Start tracking meals and expenses for a new period' : 'Switch between recorded months'}
      maxWidth="md"
    >
      {isCreating ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Month Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. October 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Starting Date *
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <input
              type="checkbox"
              id="copyMembers"
              checked={copyMembers}
              onChange={(e) => setCopyMembers(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
            />
            <label htmlFor="copyMembers" className="text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold block">Copy active members</span>
              Include existing {members.filter((m) => m.status === 'active').length} active members into this new month (historical meals/expenses will NOT be copied).
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition"
            >
              Create Month
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {months.length} Month{months.length === 1 ? '' : 's'} recorded
            </span>
            <button
              type="button"
              onClick={handleStartCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 rounded-lg hover:bg-emerald-100 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              New Month
            </button>
          </div>

          {months.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Calendar className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No months created yet</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Create your first month to start tracking meals and expenses.</p>
              <button
                type="button"
                onClick={handleStartCreate}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create First Month
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {months.map((m) => {
                const isActive = activeMonth?.id === m.id;
                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      isActive
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500/50 shadow-xs'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMonthId(m.id);
                        onClose();
                      }}
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {m.name}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white rounded-md">
                              Active
                            </span>
                          )}
                          {m.isClosed && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-md flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Closed
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Started: {m.startDate} • {m.memberIds?.length || 0} members
                        </span>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 pl-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMonthClose(m.id);
                        }}
                        title={m.isClosed ? 'Reopen Month' : 'Close Month'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                      >
                        {m.isClosed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                      {isActive && <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
