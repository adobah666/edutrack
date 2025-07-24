import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import Image from "next/image";
import Link from "next/link";
import EasyBudgetManagement from "@/components/EasyBudgetManagement";

const BudgetPage = async () => {
  const schoolFilter = await getSchoolFilter();

  // Get all data needed for budget management
  const [
    budgets,
    accounts,
    currentYearTransactions,
    school,
  ] = await Promise.all([
    // Get all budgets
    prisma.budget.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
      include: {
        budgetItems: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    // Get all accounts for budget planning
    prisma.account.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        isActive: true,
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),

    // Get current year transactions for actual vs budget comparison
    prisma.transaction.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        date: {
          gte: new Date(new Date().getFullYear(), 0, 1), // Start of current year
          lte: new Date(new Date().getFullYear(), 11, 31), // End of current year
        },
      },
      include: {
        mainAccount: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    }),

    // Get school information
    prisma.school.findFirst({
      where: schoolFilter.schoolId ? { id: schoolFilter.schoolId } : {},
      select: { name: true, address: true, phone: true },
    }),
  ]);

  // Get active budget (most recent active budget)
  const activeBudget = budgets.find(budget => budget.isActive) || budgets[0];

  // Calculate actual amounts for each budget (read-only, don't update DB here)
  const budgetsWithActuals = await Promise.all(
    budgets.map(async (budget) => {
      // Calculate budget items with actual amounts
      const budgetItemsWithActuals = await Promise.all(
        budget.budgetItems.map(async (item) => {
          // Get transactions for this specific account within the budget period
          const accountTransactions = await prisma.transaction.findMany({
            where: {
              ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
              accountId: item.accountId,
              date: {
                gte: new Date(budget.startDate),
                lte: new Date(budget.endDate),
              },
            },
          });

          // Calculate actual amount based on account type
          const actualAmount = accountTransactions.reduce((sum, transaction) => {
            if (item.account.type === "INCOME" && transaction.type === "INCOME") {
              return sum + transaction.amount;
            } else if (item.account.type === "EXPENSE" && transaction.type === "EXPENSE") {
              return sum + transaction.amount;
            }
            return sum;
          }, 0);
        
          return {
            ...item,
            actualAmount,
            variance: actualAmount - item.budgetedAmount,
            percentageUsed: item.budgetedAmount > 0 ? (actualAmount / item.budgetedAmount) * 100 : 0,
          };
        })
      );

      return {
        ...budget,
        budgetItems: budgetItemsWithActuals,
      };
    })
  );

  // Get the active budget with actuals
  const activeBudgetWithActuals = budgetsWithActuals.find(budget => budget.isActive) || budgetsWithActuals[0];
  const budgetVsActual = activeBudgetWithActuals?.budgetItems || [];

  return (
    <EasyBudgetManagement
      budgets={budgetsWithActuals}
      accounts={accounts}
      budgetVsActual={budgetVsActual}
      activeBudget={activeBudgetWithActuals}
      school={school}
    />
  );
};

export default BudgetPage;