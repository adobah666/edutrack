"use server";

import prisma from "./prisma";
import { getCurrentUserSchool } from "./school-context";

// Default account codes for automatic transactions
const DEFAULT_ACCOUNTS = {
  STUDENT_FEE_INCOME: "4001", // Income from student fees
  CASH_ACCOUNT: "1001", // Cash account
  SALARY_EXPENSE: "5001", // Salary expense account
  BANK_ACCOUNT: "1002", // Bank account
};

/**
 * Ensures default accounting accounts exist for a school
 */
export async function ensureDefaultAccounts(schoolId: string) {
  const accounts = [
    {
      code: DEFAULT_ACCOUNTS.CASH_ACCOUNT,
      name: "Cash",
      type: "ASSET" as const,
      subType: "CURRENT_ASSET" as const,
      description: "Cash on hand",
    },
    {
      code: DEFAULT_ACCOUNTS.BANK_ACCOUNT,
      name: "Bank Account",
      type: "ASSET" as const,
      subType: "CURRENT_ASSET" as const,
      description: "Bank account balance",
    },
    {
      code: DEFAULT_ACCOUNTS.STUDENT_FEE_INCOME,
      name: "Student Fee Income",
      type: "INCOME" as const,
      subType: "OPERATING_INCOME" as const,
      description: "Income from student fees and tuition",
    },
    {
      code: DEFAULT_ACCOUNTS.SALARY_EXPENSE,
      name: "Salary Expense",
      type: "EXPENSE" as const,
      subType: "OPERATING_EXPENSE" as const,
      description: "Staff salary payments",
    },
  ];

  for (const accountData of accounts) {
    await prisma.account.upsert({
      where: {
        code_schoolId: {
          code: accountData.code,
          schoolId: schoolId,
        },
      },
      update: {}, // Don't update if exists
      create: {
        ...accountData,
        schoolId,
      },
    });
  }
}

/**
 * Records a student fee payment as an accounting transaction
 */
export async function recordStudentFeeTransaction(
  studentFeeId: number,
  amount: number,
  studentName: string,
  feeTypeName: string
) {
  try {
    const userContext = await getCurrentUserSchool();
    if (!userContext.schoolId) {
      throw new Error("School context not found");
    }

    const schoolId = userContext.schoolId;

    // Ensure default accounts exist
    await ensureDefaultAccounts(schoolId);

    // Get the income account
    const incomeAccount = await prisma.account.findFirst({
      where: {
        code: DEFAULT_ACCOUNTS.STUDENT_FEE_INCOME,
        schoolId: schoolId,
      },
    });

    if (!incomeAccount) {
      throw new Error("Student fee income account not found");
    }

    // Generate reference number
    const transactionCount = await prisma.transaction.count({
      where: { schoolId },
    });
    const reference = `FEE-${new Date().getFullYear()}-${String(transactionCount + 1).padStart(4, '0')}`;

    // Create the accounting transaction
    await prisma.transaction.create({
      data: {
        reference,
        description: `Student fee payment - ${studentName} (${feeTypeName})`,
        amount,
        type: "INCOME",
        paymentMethod: "CASH", // Default to cash, can be enhanced later
        accountId: incomeAccount.id,
        date: new Date(),
        notes: `Automatic entry from student fee payment ID: ${studentFeeId}`,
        schoolId,
      },
    });

    console.log(`Recorded accounting transaction for student fee payment: ${reference}`);
  } catch (error) {
    console.error("Error recording student fee transaction:", error);
    // Don't throw error to avoid breaking the fee payment process
  }
}

/**
 * Records a salary payment as an accounting transaction
 */
export async function recordSalaryPaymentTransaction(
  salaryPaymentId: number,
  amount: number,
  teacherName: string,
  payPeriod: string
) {
  try {
    const userContext = await getCurrentUserSchool();
    if (!userContext.schoolId) {
      throw new Error("School context not found");
    }

    const schoolId = userContext.schoolId;

    // Ensure default accounts exist
    await ensureDefaultAccounts(schoolId);

    // Get the expense account
    const expenseAccount = await prisma.account.findFirst({
      where: {
        code: DEFAULT_ACCOUNTS.SALARY_EXPENSE,
        schoolId: schoolId,
      },
    });

    if (!expenseAccount) {
      throw new Error("Salary expense account not found");
    }

    // Generate reference number
    const transactionCount = await prisma.transaction.count({
      where: { schoolId },
    });
    const reference = `SAL-${new Date().getFullYear()}-${String(transactionCount + 1).padStart(4, '0')}`;

    // Create the accounting transaction
    await prisma.transaction.create({
      data: {
        reference,
        description: `Salary payment - ${teacherName} (${payPeriod})`,
        amount,
        type: "EXPENSE",
        paymentMethod: "BANK_TRANSFER", // Default to bank transfer for salaries
        accountId: expenseAccount.id,
        date: new Date(),
        notes: `Automatic entry from salary payment ID: ${salaryPaymentId}`,
        schoolId,
      },
    });

    console.log(`Recorded accounting transaction for salary payment: ${reference}`);
  } catch (error) {
    console.error("Error recording salary payment transaction:", error);
    // Don't throw error to avoid breaking the salary payment process
  }
}

/**
 * Records a bonus payment as an accounting transaction
 */
export async function recordBonusPaymentTransaction(
  bonusId: number,
  amount: number,
  teacherName: string,
  reason: string
) {
  try {
    const userContext = await getCurrentUserSchool();
    if (!userContext.schoolId) {
      throw new Error("School context not found");
    }

    const schoolId = userContext.schoolId;

    // Ensure default accounts exist
    await ensureDefaultAccounts(schoolId);

    // Get the expense account (use salary expense for bonuses too)
    const expenseAccount = await prisma.account.findFirst({
      where: {
        code: DEFAULT_ACCOUNTS.SALARY_EXPENSE,
        schoolId: schoolId,
      },
    });

    if (!expenseAccount) {
      throw new Error("Salary expense account not found");
    }

    // Generate reference number
    const transactionCount = await prisma.transaction.count({
      where: { schoolId },
    });
    const reference = `BON-${new Date().getFullYear()}-${String(transactionCount + 1).padStart(4, '0')}`;

    // Create the accounting transaction
    await prisma.transaction.create({
      data: {
        reference,
        description: `Bonus payment - ${teacherName} (${reason})`,
        amount,
        type: "EXPENSE",
        paymentMethod: "BANK_TRANSFER",
        accountId: expenseAccount.id,
        date: new Date(),
        notes: `Automatic entry from bonus payment ID: ${bonusId}`,
        schoolId,
      },
    });

    console.log(`Recorded accounting transaction for bonus payment: ${reference}`);
  } catch (error) {
    console.error("Error recording bonus payment transaction:", error);
    // Don't throw error to avoid breaking the bonus payment process
  }
}