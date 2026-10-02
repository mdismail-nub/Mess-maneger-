import {
  BudgetAnalysis,
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

// Known keywords for classifying expenses
const SHARED_EXPENSE_KEYWORDS = [
  'wifi', 'wi-fi', 'internet', 'net bill', 'broadband', 'router', 'dish', 'cable',
  'electricity', 'electric', 'current bill', 'bijli', 'bijlee', 'power bill',
  'gas', 'cylinder', 'lpg', 'gas bill',
  'water', 'water bill', 'pani', 'panir bill',
  'rent', 'house rent', 'room rent', 'flat rent', 'hostel fee', 'bhara', 'bari bhara',
  'clean', 'cleaning', 'cleaner', 'bua', 'maid', 'cook', 'baburchi', 'garbage', 'moyla',
  'utility', 'utilities', 'maintenance', 'repair', 'bulb', 'service charge', 'security', 'waste'
];

const MEAL_EXPENSE_KEYWORDS = [
  'rice', 'chal', 'chaldal', 'bhat', 'polao',
  'vegetable', 'vegetables', 'sobji', 'tarkari', 'torkari',
  'fish', 'mach', 'machh', 'ilish', 'rui', 'katla',
  'meat', 'mangsho', 'chicken', 'murgi', 'beef', 'goru', 'mutton', 'khasi',
  'egg', 'eggs', 'dim',
  'oil', 'tel', 'soyabean', 'mustard',
  'spice', 'spices', 'moshla', 'masala',
  'grocery', 'bazar', 'bazaar', 'food', 'meal',
  'breakfast', 'lunch', 'dinner', 'nashta', 'nasta',
  'dal', 'lentil', 'potato', 'alu', 'onion', 'peyaj', 'garlic', 'roshun',
  'ginger', 'ada', 'chilli', 'morich', 'salt', 'lobon', 'noon', 'turmeric', 'holud',
  'tea', 'cha', 'sugar', 'chini', 'milk', 'dudh', 'bread', 'ruti', 'paratha', 'biscuit',
  'fruit', 'fruits', 'apple', 'banana', 'kola', 'orange', 'khejur', 'dates'
];

export function autoDetectExpenseType(
  title: string = '',
  category: string = ''
): { type: 'meal' | 'shared'; isConfident: boolean; reason: string } {
  const text = `${title} ${category}`.toLowerCase();

  // If category is known utility/shared
  const catLower = category.toLowerCase().trim();
  if (
    catLower === 'gas' ||
    catLower === 'utilities' ||
    catLower === 'wifi' ||
    catLower === 'wi-fi' ||
    catLower === 'internet' ||
    catLower === 'electricity' ||
    catLower === 'rent' ||
    catLower === 'water' ||
    catLower === 'cleaning' ||
    catLower === 'maintenance'
  ) {
    return {
      type: 'shared',
      isConfident: true,
      reason: `Category "${category}" is a household/shared utility`,
    };
  }

  // Explicit check for shared keywords
  const matchedShared = SHARED_EXPENSE_KEYWORDS.find((kw) => text.includes(kw));
  // Explicit check for meal keywords
  const matchedMeal = MEAL_EXPENSE_KEYWORDS.find((kw) => text.includes(kw));

  // If title/category has strong shared keyword and no meal keyword
  if (matchedShared && !matchedMeal) {
    return {
      type: 'shared',
      isConfident: true,
      reason: `Matches shared household keyword "${matchedShared}" (Wi-Fi, utility, etc.)`,
    };
  }

  // If matches meal keyword
  if (matchedMeal) {
    return {
      type: 'meal',
      isConfident: true,
      reason: `Matches food/grocery keyword "${matchedMeal}"`,
    };
  }

  // Known default food categories
  const defaultFoodCats = ['rice', 'vegetables', 'meat', 'fish', 'eggs', 'grocery', 'oil', 'spices', 'food'];
  if (defaultFoodCats.includes(catLower)) {
    return {
      type: 'meal',
      isConfident: true,
      reason: `Category "${category}" is a standard meal category`,
    };
  }

  // Not confident - default to meal but flag for review
  return {
    type: 'meal',
    isConfident: false,
    reason: 'Could not determine with high confidence',
  };
}

export function isMealExpense(expense: Expense): boolean {
  if (expense.type === 'meal') return true;
  if (expense.type === 'shared') return false;
  return autoDetectExpenseType(expense.title, expense.category).type === 'meal';
}

export function isSharedExpense(expense: Expense): boolean {
  if (expense.type === 'shared') return true;
  if (expense.type === 'meal') return false;
  return autoDetectExpenseType(expense.title, expense.category).type === 'shared';
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

  const sharedExpenses = expenses.filter((e) => isSharedExpense(e));
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
      // Default: Equal Split among active members
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

  // Calculate expenses - strictly separate meal expenses from shared expenses
  const monthExpenses = expenses.filter((e) => e.monthId === month.id);
  const totalMealExpenses = monthExpenses
    .filter((e) => isMealExpense(e))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSharedExpenses = monthExpenses
    .filter((e) => isSharedExpense(e))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = totalMealExpenses + totalSharedExpenses;

  // Meal rate = Total MEAL EXPENSES / Total Meals (Shared expenses NEVER affect meal rate)
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

export function calculateBudgetAnalysis(
  month: Month | null,
  totalExpenses: number,
  expenses: Expense[],
  currencySymbol: string = '৳'
): BudgetAnalysis {
  if (!month || !month.budget || month.budget <= 0) {
    return {
      hasBudget: false,
      targetBudget: 0,
      totalSpent: totalExpenses,
      remainingBudget: 0,
      percentSpent: 0,
      daysInMonth: 30,
      elapsedDays: 1,
      remainingDays: 29,
      dailyAverage: 0,
      recommendedDailyRemaining: 0,
      projectedTotalSpend: totalExpenses,
      projectedPercent: 0,
      isOverBudget: false,
      isTrendingOverBudget: false,
      excessAmount: 0,
      status: 'none',
      warningMessage: null,
      adviceMessage: null,
    };
  }

  const targetBudget = month.budget;
  const totalSpent = Number(totalExpenses.toFixed(2));
  const remainingBudget = Number((targetBudget - totalSpent).toFixed(2));
  const percentSpent = Number(((totalSpent / targetBudget) * 100).toFixed(1));

  // Determine days in month from month.startDate (YYYY-MM-DD)
  let daysInMonth = 30;
  let elapsedDays = 1;
  const monthExpenses = expenses.filter((e) => e.monthId === month.id);

  if (month.startDate) {
    const parts = month.startDate.split('-');
    const year = parseInt(parts[0], 10);
    const mIndex = parseInt(parts[1], 10);
    if (!isNaN(year) && !isNaN(mIndex) && mIndex >= 1 && mIndex <= 12) {
      daysInMonth = new Date(year, mIndex, 0).getDate();
    }
  }

  // Calculate elapsed days
  const now = new Date();
  const currentY = now.getFullYear();
  const currentM = now.getMonth() + 1;
  const currentD = now.getDate();

  const monthParts = month.startDate ? month.startDate.split('-') : [];
  const mYear = parseInt(monthParts[0], 10);
  const mMonth = parseInt(monthParts[1], 10);

  if (mYear === currentY && mMonth === currentM) {
    // Current ongoing month: day of today
    elapsedDays = Math.min(Math.max(1, currentD), daysInMonth);
  } else if (month.isClosed || mYear < currentY || (mYear === currentY && mMonth < currentM)) {
    // Past or closed month: if expenses exist, up to last expense date or full month
    if (monthExpenses.length > 0) {
      const dayNumbers = monthExpenses
        .map((e) => parseInt(e.date.slice(8, 10), 10))
        .filter((d) => !isNaN(d));
      const maxExpenseDay = dayNumbers.length > 0 ? Math.max(...dayNumbers) : daysInMonth;
      elapsedDays = Math.min(Math.max(1, maxExpenseDay), daysInMonth);
    } else {
      elapsedDays = daysInMonth;
    }
  } else {
    // Future month
    elapsedDays = 1;
  }

  const remainingDays = Math.max(0, daysInMonth - elapsedDays);
  // Average daily spending so far
  const dailyAverage = Number((elapsedDays > 0 ? totalSpent / elapsedDays : 0).toFixed(2));

  // Projected total spend if current daily trend continues for remaining days
  const projectedTotalSpend = Number((totalSpent + dailyAverage * remainingDays).toFixed(2));
  const projectedPercent = Number(((projectedTotalSpend / targetBudget) * 100).toFixed(1));

  // Recommended daily allowance remaining
  const recommendedDailyRemaining =
    remainingDays > 0 && remainingBudget > 0
      ? Number((remainingBudget / remainingDays).toFixed(2))
      : 0;

  const isOverBudget = totalSpent > targetBudget;
  // A trend warning is triggered if projected spend exceeds target and we have at least 1 day of spending history
  const isTrendingOverBudget = !isOverBudget && projectedTotalSpend > targetBudget && totalSpent > 0;

  let status: 'none' | 'good' | 'warning' | 'danger' = 'good';
  let warningMessage: string | null = null;
  let adviceMessage: string | null = null;

  if (isOverBudget) {
    status = 'danger';
    const excess = Number((totalSpent - targetBudget).toFixed(2));
    warningMessage = `Budget exceeded by ${formatCurrency(excess, currencySymbol)}!`;
    adviceMessage = `Total expenses (${formatCurrency(totalSpent, currencySymbol)}) have surpassed your ${formatCurrency(targetBudget, currencySymbol)} monthly target.`;
  } else if (isTrendingOverBudget) {
    status = 'warning';
    const projectedExcess = Number((projectedTotalSpend - targetBudget).toFixed(2));
    warningMessage = `Spending trend warning: At current pace (${formatCurrency(dailyAverage, currencySymbol)}/day), projected expenses will exceed your budget by ${formatCurrency(projectedExcess, currencySymbol)}.`;
    adviceMessage = `Projected month-end spend: ${formatCurrency(projectedTotalSpend, currencySymbol)} (${projectedPercent}% of budget). Limit daily spending to ${formatCurrency(recommendedDailyRemaining, currencySymbol)}/day for the remaining ${remainingDays} days to stay within budget.`;
  } else {
    status = 'good';
    adviceMessage = `Spending is on track! Average pace: ${formatCurrency(dailyAverage, currencySymbol)}/day. Projected month-end: ${formatCurrency(projectedTotalSpend, currencySymbol)} (${projectedPercent}% of target).`;
  }

  return {
    hasBudget: true,
    targetBudget,
    totalSpent,
    remainingBudget,
    percentSpent,
    daysInMonth,
    elapsedDays,
    remainingDays,
    dailyAverage,
    recommendedDailyRemaining,
    projectedTotalSpend,
    projectedPercent,
    isOverBudget,
    isTrendingOverBudget,
    excessAmount: isOverBudget ? totalSpent - targetBudget : Math.max(0, projectedTotalSpend - targetBudget),
    status,
    warningMessage,
    adviceMessage,
  };
}
