import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MealType } from '../types';
import { NavTab } from '../components/layout/AppLayout';

interface MealsPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const MealsPage: React.FC<MealsPageProps> = ({ onNavigate }) => {
  const {
    activeMonth,
    members,
    meals,
    toggleMeal,
    setDayMealsBatch,
  } = useApp();

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const monthMembers = useMemo(() => {
    if (!activeMonth) return [];
    const idSet = new Set(activeMonth.memberIds);
    return members.filter((m) => idSet.has(m.id));
  }, [members, activeMonth]);

  const dailyMealsMap = useMemo(() => {
    const map: Record<string, { breakfast: boolean; lunch: boolean; dinner: boolean }> = {};
    monthMembers.forEach((m) => {
      map[m.id] = { breakfast: false, lunch: false, dinner: false };
    });

    meals
      .filter((m) => m.monthId === activeMonth?.id && m.date === selectedDate)
      .forEach((m) => {
        if (!map[m.memberId]) {
          map[m.memberId] = { breakfast: false, lunch: false, dinner: false };
        }
        map[m.memberId].breakfast = m.breakfast;
        map[m.memberId].lunch = m.lunch;
        map[m.memberId].dinner = m.dinner;
      });

    return map;
  }, [meals, activeMonth, selectedDate, monthMembers]);

  const monthlyMemberTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    monthMembers.forEach((m) => {
      totals[m.id] = 0;
    });

    meals
      .filter((m) => m.monthId === activeMonth?.id)
      .forEach((m) => {
        const count =
          (m.breakfast ? 1 : 0) +
          (m.lunch ? 1 : 0) +
          (m.dinner ? 1 : 0);
        totals[m.memberId] = (totals[m.memberId] || 0) + count;
      });

    return totals;
  }, [meals, activeMonth, monthMembers]);

  const dayStats = useMemo(() => {
    let b = 0;
    let l = 0;
    let d = 0;
    for (const mId of Object.keys(dailyMealsMap)) {
      if (dailyMealsMap[mId].breakfast) b++;
      if (dailyMealsMap[mId].lunch) l++;
      if (dailyMealsMap[mId].dinner) d++;
    }
    return {
      breakfast: b,
      lunch: l,
      dinner: d,
      total: b + l + d,
    };
  }, [dailyMealsMap]);

  const handlePrevDay = () => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() - 1);
    setSelectedDate(curr.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() + 1);
    setSelectedDate(curr.toISOString().slice(0, 10));
  };

  const formattedSelectedDate = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  if (!activeMonth) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        No active month selected.
      </div>
    );
  }

  if (monthMembers.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center max-w-sm mx-auto space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">No Members in This Month</h3>
        <p className="text-xs text-slate-500">
          Add members to begin recording daily meals.
        </p>
        <button
          onClick={() => onNavigate('members')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Member</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* DATE SELECTOR & DAY STATS */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Navigation */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
            />
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              ({formattedSelectedDate})
            </span>
            {selectedDate !== todayStr && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-1 cursor-pointer"
              >
                Today
              </button>
            )}
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day Summary Count */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>B: <strong className="text-slate-900 dark:text-white">{dayStats.breakfast}</strong></span>
          <span>L: <strong className="text-slate-900 dark:text-white">{dayStats.lunch}</strong></span>
          <span>D: <strong className="text-slate-900 dark:text-white">{dayStats.dinner}</strong></span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>Total: <strong className="text-blue-600 dark:text-blue-400 font-bold">{dayStats.total}</strong></span>
        </div>
      </div>

      {/* QUICK BATCH SELECTION */}
      <div className="flex items-center justify-between text-xs px-1 text-slate-500 flex-wrap gap-2">
        <span>Quick select for {formattedSelectedDate}:</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDayMealsBatch(selectedDate, 'breakfast', true)}
            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium cursor-pointer"
          >
            + All Breakfast
          </button>
          <button
            onClick={() => setDayMealsBatch(selectedDate, 'lunch', true)}
            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium cursor-pointer"
          >
            + All Lunch
          </button>
          <button
            onClick={() => setDayMealsBatch(selectedDate, 'dinner', true)}
            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium cursor-pointer"
          >
            + All Dinner
          </button>
          <button
            onClick={() => {
              setDayMealsBatch(selectedDate, 'breakfast', false);
              setDayMealsBatch(selectedDate, 'lunch', false);
              setDayMealsBatch(selectedDate, 'dinner', false);
            }}
            className="px-2 py-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-medium cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* MEALS LIST / TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-4">Member</th>
                <th className="py-2.5 px-3 text-center w-24">Breakfast</th>
                <th className="py-2.5 px-3 text-center w-24">Lunch</th>
                <th className="py-2.5 px-3 text-center w-24">Dinner</th>
                <th className="py-2.5 px-3 text-center w-20">Day Total</th>
                <th className="py-2.5 px-4 text-right w-24">Month Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {monthMembers.map((member) => {
                const dayMeals = dailyMealsMap[member.id] || {
                  breakfast: false,
                  lunch: false,
                  dinner: false,
                };
                const dayCount =
                  (dayMeals.breakfast ? 1 : 0) +
                  (dayMeals.lunch ? 1 : 0) +
                  (dayMeals.dinner ? 1 : 0);
                const monthlyTotal = monthlyMemberTotals[member.id] || 0;

                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {member.name}
                    </td>

                    {/* Breakfast */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleMeal(selectedDate, member.id, 'breakfast')}
                        className={`w-9 h-8 mx-auto rounded-lg flex items-center justify-center transition cursor-pointer text-xs ${
                          dayMeals.breakfast
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-300 hover:text-slate-500'
                        }`}
                      >
                        {dayMeals.breakfast ? <Check className="w-4 h-4 stroke-[3]" /> : '—'}
                      </button>
                    </td>

                    {/* Lunch */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleMeal(selectedDate, member.id, 'lunch')}
                        className={`w-9 h-8 mx-auto rounded-lg flex items-center justify-center transition cursor-pointer text-xs ${
                          dayMeals.lunch
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-300 hover:text-slate-500'
                        }`}
                      >
                        {dayMeals.lunch ? <Check className="w-4 h-4 stroke-[3]" /> : '—'}
                      </button>
                    </td>

                    {/* Dinner */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleMeal(selectedDate, member.id, 'dinner')}
                        className={`w-9 h-8 mx-auto rounded-lg flex items-center justify-center transition cursor-pointer text-xs ${
                          dayMeals.dinner
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-300 hover:text-slate-500'
                        }`}
                      >
                        {dayMeals.dinner ? <Check className="w-4 h-4 stroke-[3]" /> : '—'}
                      </button>
                    </td>

                    {/* Day Count */}
                    <td className="py-2.5 px-3 text-center font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                      {dayCount}
                    </td>

                    {/* Monthly Total */}
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                      {monthlyTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Clean Touch Rows */}
        <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {monthMembers.map((member) => {
            const dayMeals = dailyMealsMap[member.id] || {
              breakfast: false,
              lunch: false,
              dinner: false,
            };
            const dayCount =
              (dayMeals.breakfast ? 1 : 0) +
              (dayMeals.lunch ? 1 : 0) +
              (dayMeals.dinner ? 1 : 0);
            const monthlyTotal = monthlyMemberTotals[member.id] || 0;

            return (
              <div key={member.id} className="p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {member.name}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Today: <strong className="text-slate-900 dark:text-white">{dayCount}</strong> • Month: <strong className="text-slate-900 dark:text-white">{monthlyTotal}</strong>
                  </span>
                </div>

                {/* 3 Large Touch Buttons: Breakfast, Lunch, Dinner */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMeal(selectedDate, member.id, 'breakfast')}
                    className={`min-h-[44px] py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer ${
                      dayMeals.breakfast
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    {dayMeals.breakfast && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>Breakfast</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleMeal(selectedDate, member.id, 'lunch')}
                    className={`min-h-[44px] py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer ${
                      dayMeals.lunch
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    {dayMeals.lunch && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>Lunch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleMeal(selectedDate, member.id, 'dinner')}
                    className={`min-h-[44px] py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer ${
                      dayMeals.dinner
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    {dayMeals.dinner && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>Dinner</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
