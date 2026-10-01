import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { MemberMonthSummary } from '../../types';
import { Utensils, PieChart as PieIcon, BarChart3 } from 'lucide-react';

interface MealDistributionChartProps {
  memberSummaries: MemberMonthSummary[];
  totalMeals: number;
}

const COLORS = [
  '#059669', // Emerald
  '#0284c7', // Sky Blue
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#10b981', // Mint
  '#0d9488', // Deep Teal
  '#f43f5e', // Rose
  '#64748b', // Slate
];

export const MealDistributionChart: React.FC<MealDistributionChartProps> = ({
  memberSummaries,
  totalMeals,
}) => {
  const [viewMode, setViewMode] = useState<'donut' | 'breakdown'>('donut');

  const donutData = useMemo(() => {
    return memberSummaries
      .filter((m) => m.totalMeals > 0)
      .map((m, index) => ({
        name: m.member.name,
        value: m.totalMeals,
        percentage: totalMeals > 0 ? (m.totalMeals / totalMeals) * 100 : 0,
        color: COLORS[index % COLORS.length],
      }));
  }, [memberSummaries, totalMeals]);

  const barData = useMemo(() => {
    return memberSummaries.map((m) => ({
      name: m.member.name,
      breakfast: m.breakfastCount,
      lunch: m.lunchCount,
      dinner: m.dinnerCount,
      total: m.totalMeals,
    }));
  }, [memberSummaries]);

  if (totalMeals === 0 || memberSummaries.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
        <Utensils className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Meals Counted Yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Record daily breakfast, lunch, or dinner meals to see member consumption distribution.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Meal Share Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Proportion of total meals eaten across borders ({totalMeals} meals total)
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setViewMode('donut')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
              viewMode === 'donut'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Donut Share</span>
          </button>
          <button
            onClick={() => setViewMode('breakdown')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
              viewMode === 'breakdown'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>B / L / D Split</span>
          </button>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'donut' ? (
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 text-white p-2.5 rounded-xl shadow-xl text-xs border border-slate-700 space-y-1 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: data.color }}
                          />
                          <span className="font-bold">{data.name}</span>
                        </div>
                        <p className="text-slate-300">
                          Meals: <strong className="text-white">{data.value}</strong> ({data.percentage.toFixed(1)}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
                formatter={(value) => {
                  const item = donutData.find((d) => d.name === value);
                  return (
                    <span className="text-slate-700 dark:text-slate-300">
                      {value} ({item ? item.value : 0})
                    </span>
                  );
                }}
              />
            </PieChart>
          ) : (
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.6} />
              <XAxis dataKey="name" stroke="currentColor" className="text-slate-400 text-[11px]" tickLine={false} />
              <YAxis stroke="currentColor" className="text-slate-400 text-[11px]" tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 space-y-1 backdrop-blur-md">
                        <p className="font-bold border-b border-slate-700 pb-1 text-slate-200">{label}</p>
                        <div className="flex justify-between gap-4 text-amber-400">
                          <span>Breakfast:</span>
                          <span className="font-bold">{data.breakfast}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-sky-400">
                          <span>Lunch:</span>
                          <span className="font-bold">{data.lunch}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-emerald-400">
                          <span>Dinner:</span>
                          <span className="font-bold">{data.dinner}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-white font-bold pt-1 border-t border-slate-800">
                          <span>Total:</span>
                          <span>{data.total} meals</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" />
              <Bar dataKey="breakfast" name="Breakfast" stackId="meals" fill="#64748b" />
              <Bar dataKey="lunch" name="Lunch" stackId="meals" fill="#0284c7" />
              <Bar dataKey="dinner" name="Dinner" stackId="meals" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
