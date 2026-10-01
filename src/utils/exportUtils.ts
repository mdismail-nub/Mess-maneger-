import { Month, MonthFinancialSummary, Expense, Payment, AppSettings } from '../types';
import { formatCurrency } from './calculations';

export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateMonthSummaryCSV(
  month: Month,
  summary: MonthFinancialSummary,
  settings: AppSettings
): void {
  const currency = settings.currencySymbol;
  const lines: string[] = [];

  // Header Section
  lines.push(`"${settings.messName || 'MessMate'} - Monthly Financial & Meal Settlement"`);
  lines.push(`"Month: ${month.name}","Status: ${month.isClosed ? 'Closed' : 'Active'}","Generated: ${new Date().toLocaleDateString()}"`);
  lines.push('');

  // Key Financial Overview
  lines.push('"Key Financial Summary"');
  lines.push(`"Total Members","${summary.totalMembers}"`);
  lines.push(`"Total Meals","${summary.totalMeals}"`);
  lines.push(`"Meal Rate","${currency}${summary.currentMealRate.toFixed(2)}"`);
  lines.push(`"Food Expenses","${currency}${summary.totalMealExpenses.toFixed(2)}"`);
  lines.push(`"Shared Expenses","${currency}${summary.totalSharedExpenses.toFixed(2)}"`);
  lines.push(`"Total Spent","${currency}${summary.totalExpenses.toFixed(2)}"`);
  lines.push(`"Total Collected","${currency}${summary.totalPayments.toFixed(2)}"`);
  lines.push(`"Net Outstanding Dues","${currency}${summary.totalOutstandingDue.toFixed(2)}"`);
  lines.push('');

  // Member Table
  lines.push('"Individual Member Settlements"');
  lines.push('"Member Name","Meals","Food Cost","Shared Cost","Total Payable","Total Paid","Net Balance","Status"');

  summary.memberSummaries.forEach((m) => {
    lines.push(
      `"${m.member.name}","${m.totalMeals}","${m.foodCost.toFixed(2)}","${m.sharedCost.toFixed(2)}","${m.totalPayable.toFixed(2)}","${m.totalPaid.toFixed(2)}","${m.balance.toFixed(2)}","${m.status.toUpperCase()}"`
    );
  });

  const filename = `${(settings.messName || 'MessMate').toLowerCase().replace(/\s+/g, '_')}_settlement_${month.name.toLowerCase().replace(/\s+/g, '_')}.csv`;
  downloadCSV(filename, lines.join('\n'));
}

export function generateExpenseReportCSV(
  month: Month,
  expenses: Expense[],
  membersMap: Map<string, string>,
  settings: AppSettings
): void {
  const lines: string[] = [];
  lines.push(`"${settings.messName || 'MessMate'} - Expense Log - ${month.name}"`);
  lines.push('"Date","Title","Category","Type","Paid By","Amount","Notes"');

  expenses
    .filter((e) => e.monthId === month.id)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((e) => {
      const payer = membersMap.get(e.paidByMemberId) || 'Unknown';
      lines.push(
        `"${e.date}","${e.title.replace(/"/g, '""')}","${e.category}","${e.type}","${payer}","${e.amount.toFixed(2)}","${(e.note || '').replace(/"/g, '""')}"`
      );
    });

  const filename = `expenses_${month.name.toLowerCase().replace(/\s+/g, '_')}.csv`;
  downloadCSV(filename, lines.join('\n'));
}
