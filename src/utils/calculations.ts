import {
  Expense,
  MealEntry,
  Member,
  MemberMonthSummary,
  Month,
  MonthFinancialSummary,
  Payment,
  SettlementTransaction,
} from '../types';

export function formatCurrency(amount: number, symbol: string = '৳'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

export function calculateMealRate(totalMealExpenses: number, totalMeals: number): number {
  if (totalMeals <= 0) return 0;
  return Number((totalMealExpenses / totalMeals).toFixed(4));
}

export function calculateSharedExpensesShares(
  expenses: Expense[],
  members: Member[],
  memberMealCounts: Record<string, number>,
  totalMeals: number
): Record<string, number> {
  const shares: Record<string, number> = {};
  members.forEach((m) => {
    shares[m.id] = 0;
  });

  const sharedExpenses = expenses.filter((e) => e.type === 'shared');
  const activeMembers = members.filter((m) => m.status === 'active');
  const splitGroup = activeMembers.length > 0 ? activeMembers : members;

  for (const exp of sharedExpenses) {
    if (exp.splitMethod === 'custom' && exp.customShares) {
      for (const [mId, share] of Object.entries(exp.customShares)) {
        shares[mId] = (shares[mId] || 0) + (Number(share) || 0);
      }
    } else if (exp.splitMethod === 'meal_based') {
      if (totalMeals > 0) {
        for (const m of splitGroup) {
          const mMeals = memberMealCounts[m.id] || 0;
          const share = (mMeals / totalMeals) * exp.amount;
          shares[m.id] = (shares[m.id] || 0) + share;
        }
      } else {
        // Fallback to equal split if no meals
        const equalShare = exp.amount / (splitGroup.length || 1);
        for (const m of splitGroup) {
          shares[m.id] = (shares[m.id] || 0) + equalShare;
        }
      }
    } else {
      // Default: Equal Split
      const equalShare = exp.amount / (splitGroup.length || 1);
      for (const m of splitGroup) {
        shares[m.id] = (shares[m.id] || 0) + equalShare;
      }
    }
  }

  // Round each member's share to 2 decimal places
  for (const id of Object.keys(shares)) {
    shares[id] = Number(shares[id].toFixed(2));
  }

  return shares;
}

export function calculateMonthSummary(
  month: Month,
  allMembers: Member[],
  meals: MealEntry[],
  expenses: Expense[],
  payments: Payment[]
): MonthFinancialSummary {
  // Filter members relevant to this month (active or in month.memberIds)
  const relevantMembers = allMembers.filter((m) => {
    if (month.memberIds && month.memberIds.length > 0) {
      return month.memberIds.includes(m.id);
    }
    return m.status === 'active';
  });

  // Calculate meal counts
  const memberMealsMap: Record<
    string,
    { total: number; breakfast: number; lunch: number; dinner: number }
  > = {};

  relevantMembers.forEach((m) => {
    memberMealsMap[m.id] = { total: 0, breakfast: 0, lunch: 0, dinner: 0 };
  });

  let totalMeals = 0;
  let totalBreakfast = 0;
  let totalLunch = 0;
  let totalDinner = 0;

  for (const meal of meals) {
    if (meal.monthId !== month.id) continue;
    if (!memberMealsMap[meal.memberId]) {
      memberMealsMap[meal.memberId] = { total: 0, breakfast: 0, lunch: 0, dinner: 0 };
    }
    const b = meal.breakfast ? 1 : 0;
    const l = meal.lunch ? 1 : 0;
    const d = meal.dinner ? 1 : 0;
    const subtotal = b + l + d;

    memberMealsMap[meal.memberId].breakfast += b;
    memberMealsMap[meal.memberId].lunch += l;
    memberMealsMap[meal.memberId].dinner += d;
    memberMealsMap[meal.memberId].total += subtotal;

    totalBreakfast += b;
    totalLunch += l;
    totalDinner += d;
    totalMeals += subtotal;
  }

  // Calculate expenses
  const monthExpenses = expenses.filter((e) => e.monthId === month.id);
  const totalMealExpenses = monthExpenses
    .filter((e) => e.type === 'meal')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSharedExpenses = monthExpenses
    .filter((e) => e.type === 'shared')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = totalMealExpenses + totalSharedExpenses;

  // Meal rate
  const currentMealRate = calculateMealRate(totalMealExpenses, totalMeals);

  // Shared expenses allocation
  const mealCountOnly: Record<string, number> = {};
  relevantMembers.forEach((m) => {
    mealCountOnly[m.id] = memberMealsMap[m.id]?.total || 0;
  });

  const sharedShares = calculateSharedExpensesShares(
    monthExpenses,
    relevantMembers,
    mealCountOnly,
    totalMeals
  );

  // Payments per member
  const monthPayments = payments.filter((p) => p.monthId === month.id);
  const memberPaymentsMap: Record<string, number> = {};
  relevantMembers.forEach((m) => {
    memberPaymentsMap[m.id] = 0;
  });
  let totalPayments = 0;

  for (const p of monthPayments) {
    memberPaymentsMap[p.memberId] = (memberPaymentsMap[p.memberId] || 0) + p.amount;
    totalPayments += p.amount;
  }

  // Build member summaries
  let totalOutstandingDue = 0;
  let totalReceivable = 0;

  const memberSummaries: MemberMonthSummary[] = relevantMembers.map((member) => {
    const mealInfo = memberMealsMap[member.id] || { total: 0, breakfast: 0, lunch: 0, dinner: 0 };
    // Food cost = meals * meal rate
    const foodCost = Number((mealInfo.total * currentMealRate).toFixed(2));
    const sharedCost = Number((sharedShares[member.id] || 0).toFixed(2));
    const totalPayable = Number((foodCost + sharedCost).toFixed(2));
    const totalPaid = Number((memberPaymentsMap[member.id] || 0).toFixed(2));
    const balance = Number((totalPayable - totalPaid).toFixed(2));

    let status: 'due' | 'receivable' | 'settled' = 'settled';
    if (balance > 0.01) {
      status = 'due';
      totalOutstandingDue += balance;
    } else if (balance < -0.01) {
      status = 'receivable';
      totalReceivable += Math.abs(balance);
    }

    return {
      member,
      totalMeals: mealInfo.total,
      breakfastCount: mealInfo.breakfast,
      lunchCount: mealInfo.lunch,
      dinnerCount: mealInfo.dinner,
      foodCost,
      sharedCost,
      totalPayable,
      totalPaid,
      balance,
      status,
    };
  });

  return {
    totalMembers: relevantMembers.length,
    totalMeals,
    totalBreakfast,
    totalLunch,
    totalDinner,
    totalMealExpenses,
    currentMealRate,
    totalSharedExpenses,
    totalExpenses,
    totalPayments,
    totalOutstandingDue: Number(totalOutstandingDue.toFixed(2)),
    totalReceivable: Number(totalReceivable.toFixed(2)),
    memberSummaries,
  };
}

export function calculateSettlement(memberSummaries: MemberMonthSummary[]): SettlementTransaction[] {
  // Net debtors: balance > 0 (owes money)
  // Net creditors: balance < 0 (is owed money, receivable = -balance)
  const debtors = memberSummaries
    .filter((m) => m.balance > 0.01)
    .map((m) => ({
      id: m.member.id,
      name: m.member.name,
      amount: m.balance,
    }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = memberSummaries
    .filter((m) => m.balance < -0.01)
    .map((m) => ({
      id: m.member.id,
      name: m.member.name,
      amount: Math.abs(m.balance),
    }))
    .sort((a, b) => b.amount - a.amount);

  const transactions: SettlementTransaction[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0.01) {
      transactions.push({
        fromMemberId: debtor.id,
        fromMemberName: debtor.name,
        toMemberId: creditor.id,
        toMemberName: creditor.name,
        amount: Number(settleAmount.toFixed(2)),
      });
    }

    debtor.amount = Number((debtor.amount - settleAmount).toFixed(2));
    creditor.amount = Number((creditor.amount - settleAmount).toFixed(2));

    if (debtor.amount <= 0.01) {
      dIdx++;
    }
    if (creditor.amount <= 0.01) {
      cIdx++;
    }
  }

  return transactions;
}
