import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { Expense } from '../../types';
import { formatCurrency, isMealExpense } from '../../utils/calculations';

interface SpendingTrendChartProps {
  expenses: Expense[];
  currencySymbol: string;
  monthName: string;
  budget?: number;
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  expenses,
  currencySymbol,
  monthName,
  budget,
}) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const chartData = useMemo(() => {
    if (expenses.length === 0) return [];

    const map: Record<string, { date: string; day: string; meal: number; shared: number; total: number }> = {};

    expenses.forEach((e) => {
      const day = e.date.slice(8);
      if (!map[e.date]) {
        map[e.date] = {
          date: e.date,
          day: `${parseInt(day, 10)}`,
          meal: 0,
          shared: 0,
          total: 0,
        };
      }
      if (isMealExpense(e)) {
        map[e.date].meal += e.amount;
      } else {
        map[e.date].shared += e.amount;
      }
      map[e.date].total += e.amount;
    });

    const sorted = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));

    let runningTotal = 0;
    return sorted.map((item) => {
      runningTotal += item.total;
      return {
        ...item,
        cumulative: runningTotal,
      };
    });
  }, [expenses]);

  if (chartData.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        No expense entries recorded for this period yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Daily &amp; cumulative expenses ({monthName})</span>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
          <button
            onClick={() => setChartType('area')}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              chartType === 'area'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cumulative
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              chartType === 'bar'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Daily Bars
          </button>
        </div>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-800" opacity={0.6} />
              <XAxis dataKey="day" stroke="currentColor" className="text-slate-400 text-[10px]" tickLine={false} />
              <YAxis stroke="currentColor" className="text-slate-400 text-[10px]" tickLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-md space-y-1">
                        <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1">{data.date}</p>
                        <div className="flex justify-between gap-3 text-slate-300">
                          <span>Meal cost:</span>
                          <span className="font-mono">{formatCurrency(data.meal, currencySymbol)}</span>
                        </div>
                        <div className="flex justify-between gap-3 text-slate-300">
                          <span>Shared cost:</span>
                          <span className="font-mono">{formatCurrency(data.shared, currencySymbol)}</span>
                        </div>
                        <div className="flex justify-between gap-3 text-blue-400 font-semibold pt-0.5 border-t border-slate-800">
                          <span>Total to date:</span>
                          <span className="font-mono">{formatCurrency(data.cumulative, currencySymbol)}</span>
                        </div>
                        {budget && budget > 0 && (
                          <div className={`flex justify-between gap-3 text-[11px] pt-0.5 ${
                            data.cumulative > budget ? 'text-rose-400 font-semibold' : 'text-slate-400'
                          }`}>
                            <span>Budget ({currencySymbol}{budget.toLocaleString()}):</span>
                            <span className="font-mono">
                              {data.cumulative > budget
                                ? `+${formatCurrency(data.cumulative - budget, currencySymbol)} over`
                                : `${formatCurrency(budget - data.cumulative, currencySymbol)} left`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {budget && budget > 0 && (
                <ReferenceLine
                  y={budget}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Budget: ${currencySymbol}${budget.toLocaleString()}`,
                    fill: '#f43f5e',
                    fontSize: 10,
                    fontWeight: 600,
                    position: 'top',
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Total Spent"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#spendGrad)"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-800" opacity={0.6} />
              <XAxis dataKey="day" stroke="currentColor" className="text-slate-400 text-[10px]" tickLine={false} />
              <YAxis stroke="currentColor" className="text-slate-400 text-[10px]" tickLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-md space-y-1">
                        <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1">{data.date}</p>
                        <div className="flex justify-between gap-3 text-emerald-400">
                          <span>Meal Expense (In Rate):</span>
                          <span className="font-mono font-semibold">{formatCurrency(data.meal, currencySymbol)}</span>
                        </div>
                        <div className="flex justify-between gap-3 text-indigo-400">
                          <span>Shared Expense (Excluded):</span>
                          <span className="font-mono font-semibold">{formatCurrency(data.shared, currencySymbol)}</span>
                        </div>
                        <div className="flex justify-between gap-3 text-slate-300 pt-0.5 border-t border-slate-800 font-bold">
                          <span>Day Total:</span>
                          <span className="font-mono">{formatCurrency(data.total, currencySymbol)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} iconType="circle" />
              <Bar dataKey="meal" name="Meal Expenses (In Rate)" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="shared" name="Shared Expenses (Excluded)" stackId="a" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
