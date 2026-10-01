import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { MemberMonthSummary } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { Scale } from 'lucide-react';

interface CashflowComparisonChartProps {
  memberSummaries: MemberMonthSummary[];
  currencySymbol: string;
}

export const CashflowComparisonChart: React.FC<CashflowComparisonChartProps> = ({
  memberSummaries,
  currencySymbol,
}) => {
  const chartData = useMemo(() => {
    return memberSummaries.map((m) => ({
      name: m.member.name,
      payable: m.totalPayable,
      paid: m.totalPaid,
      balance: m.balance,
      status: m.status,
    }));
  }, [memberSummaries]);

  if (memberSummaries.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <Scale className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            Cost Payable vs Deposits Paid
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare total costs owed against actual money deposited per member
          </p>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.6} />
            <XAxis dataKey="name" stroke="currentColor" className="text-slate-400 text-[11px]" tickLine={false} />
            <YAxis stroke="currentColor" className="text-slate-400 text-[11px]" tickLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 space-y-1.5 backdrop-blur-md">
                      <p className="font-bold border-b border-slate-700 pb-1 text-slate-200">{label}</p>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Total Payable:</span>
                        <span className="font-bold font-mono text-white">{formatCurrency(data.payable, currencySymbol)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-emerald-400">
                        <span>Paid (Deposits):</span>
                        <span className="font-bold font-mono">{formatCurrency(data.paid, currencySymbol)}</span>
                      </div>
                      <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 font-bold">
                        <span>Net Balance:</span>
                        <span className={data.status === 'due' ? 'text-rose-400' : data.status === 'receivable' ? 'text-sky-400' : 'text-slate-400'}>
                          {formatCurrency(data.balance, currencySymbol)} ({data.status})
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" />
            <Bar dataKey="payable" name="Total Cost Payable" fill="#475569" radius={[4, 4, 0, 0]} />
            <Bar dataKey="paid" name="Total Paid (Deposits)" fill="#059669" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
