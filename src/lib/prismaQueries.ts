// src/lib/prismaQueries.ts
import prisma from './prisma';
import { ITEM_PER_PAGE } from './settings';
import { Prisma } from '@prisma/client';

type FeeWithRelations = {
  id: number;
  amount: number;
  dueDate: Date;
  classId: number;
  feeTypeId: number;
  className: string;
  feeTypeName: string;
  paidCount: number;
  totalStudents: number;
  totalPaid: number;
}

export async function getFeesData(query: Prisma.Sql, p: number): Promise<{
  fees: FeeWithRelations[];
  count: { count: string }[];
}> {
  const [fees, count] = await prisma.$transaction([
    prisma.$queryRaw<FeeWithRelations[]>`
      WITH StudentPayments AS (
        SELECT 
          sf."classFeeId",
          sf."studentId",
          SUM(sf.amount) as paid_amount
        FROM "StudentFee" sf
        GROUP BY sf."classFeeId", sf."studentId"
      ),
      PaymentSummary AS (
        SELECT 
          sp."classFeeId",
          COUNT(DISTINCT sp."studentId") as paid_students_count,
          SUM(sp.paid_amount) as total_paid_amount
        FROM StudentPayments sp
        GROUP BY sp."classFeeId"
      ),      EligibleStudents AS (
        SELECT 
          sfe."classFeeId",
          COUNT(DISTINCT sfe."studentId") as eligible_students
        FROM "StudentFeeEligibility" sfe
        GROUP BY sfe."classFeeId"
      )
      SELECT 
        cf.id,
        cf.amount,
        cf."dueDate",
        cf."classId",
        cf."feeTypeId",
        c.name as "className",
        ft.name as "feeTypeName",
        COALESCE(ps.paid_students_count, 0) as "paidCount",
        COALESCE(es.eligible_students, 0) as "totalStudents",
        COALESCE(ps.total_paid_amount, 0) as "totalPaid"
      FROM "ClassFee" cf
      LEFT JOIN "Class" c ON cf."classId" = c.id
      LEFT JOIN "FeeType" ft ON cf."feeTypeId" = ft.id
      LEFT JOIN PaymentSummary ps ON ps."classFeeId" = cf.id
      LEFT JOIN EligibleStudents es ON es."classFeeId" = cf.id
      ${query}
      ORDER BY cf."dueDate" DESC
      LIMIT ${ITEM_PER_PAGE}
      OFFSET ${ITEM_PER_PAGE * (p - 1)}
    `,
    prisma.$queryRaw<{ count: string }[]>`
      SELECT COUNT(*)::text
      FROM "ClassFee" cf
      LEFT JOIN "Class" c ON cf."classId" = c.id
      LEFT JOIN "FeeType" ft ON cf."feeTypeId" = ft.id
      ${query}
    `,
  ]);

  return { fees, count };
}

interface ClassData {
  id: number;
  name: string;
}

interface FeeTypeData {
  id: number;
  name: string;
}

export async function getClassesAndFeeTypes(schoolId?: string): Promise<{
  classes: ClassData[];
  feeTypes: FeeTypeData[];
}> {
  const schoolCondition = schoolId ? Prisma.sql`WHERE "schoolId" = ${schoolId}` : Prisma.empty;
  
  const [classes, feeTypes] = await Promise.all([
    prisma.$queryRaw<ClassData[]>`
      SELECT id, name
      FROM "Class"
      ${schoolCondition}
      ORDER BY name ASC
    `,
    prisma.$queryRaw<FeeTypeData[]>`
      SELECT id, name
      FROM "FeeType"
      ${schoolCondition}
      ORDER BY name ASC
    `,
  ]);

  return { classes, feeTypes };
}
