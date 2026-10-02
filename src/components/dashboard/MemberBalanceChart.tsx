import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import { MemberMonthSummary } from '../../types';
import { formatCurrency } from '../../utils/calculations';

interface MemberBalanceChartProps {
  memberSummaries: MemberMonthSummary[];
  currencySymbol: string;
}

export const MemberBalanceChart: React.FC<MemberBalanceChartProps> = ({
  memberSummaries,
  currencySymbol,
}) => {
  const chartData = memberSummaries.map((m) => {
    const diff = Number((m.totalPaid - m.totalPayable).toFixed(2));
    return {
      name: m.member.name,
      meals: m.totalMeals,
      balance: diff,
      cost: m.totalPayable,
      paid: m.totalPaid,
      status: m.status,
    };
  });

  if (chartData.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">
            Meals &amp; Balance
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Meals and money (+ / -)
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-medium">
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600"></span>
            Meals
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
            + Surplus
          </span>
          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span>
            - Due
          </span>
        </div>
      </div>

      <div className="h-60 sm:h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              opacity={0.6}
            />
            <XAxis
              dataKey="name"
              stroke="currentColor"
              className="text-slate-400 text-[11px]"
              tickLine={false}
            />
            <YAxis
              yAxisId="meals"
              orientation="left"
              stroke="#3b82f6"
              className="text-[10px]"
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="money"
              orientation="right"
              stroke="#64748b"
              className="text-[10px]"
              tickLine={false}
              tickFormatter={(val) => `${val >= 0 ? '+' : ''}${currencySymbol}${val}`}
            />
            <ReferenceLine
              yAxisId="money"
              y={0}
              stroke="#94a3b8"
              strokeWidth={1.5}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 space-y-1.5 backdrop-blur-md">
                      <div className="font-bold border-b border-slate-700 pb-1 text-slate-200">
                        {data.name}
                      </div>
                      <div className="flex justify-between gap-4 text-blue-400">
                        <span>Meals:</span>
                        <span className="font-bold font-mono">{data.meals} meals</span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Total Cost:</span>
                        <span className="font-mono">{formatCurrency(data.cost, currencySymbol)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Total Paid:</span>
                        <span className="font-mono">{formatCurrency(data.paid, currencySymbol)}</span>
                      </div>
                      <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 font-bold">
                        <span>Net Position:</span>
                        <span
                          className={
                            data.balance > 0
                              ? 'text-emerald-400'
                              : data.balance < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }
                        >
                          {data.balance > 0 ? '+' : ''}
                          {formatCurrency(data.balance, currencySymbol)}
                          {data.balance > 0 ? ' (Receivable)' : data.balance < 0 ? ' (Due)' : ' (Settled)'}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              yAxisId="meals"
              dataKey="meals"
              name="Meals"
              fill="#3b82f6"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              yAxisId="money"
              dataKey="balance"
              name="Money (+ / -)"
              maxBarSize={28}
              radius={[3, 3, 3, 3]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.balance >= 0 ? '#10b981' : '#f43f5e'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
