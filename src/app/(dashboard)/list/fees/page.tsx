import { auth } from "@clerk/nextjs/server";
import FeesManagement from "@/components/FeesManagement";
import { getClassesAndFeeTypes, getFeesData } from "@/lib/prismaQueries";
import { Prisma } from "@prisma/client";
import { getSchoolFilter } from "@/lib/school-context";

const FeesPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const { page, search, classId, feeTypeId, sortBy } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  // Build the query parts
  const conditions = [];
  const values = [];

  // Add school filtering
  if (schoolFilter.schoolId) {
    conditions.push(Prisma.sql`cf."schoolId" = ${schoolFilter.schoolId}`);
  }

  if (classId) {
    conditions.push(Prisma.sql`cf."classId" = ${parseInt(classId)}`);
  }

  if (feeTypeId) {
    conditions.push(Prisma.sql`cf."feeTypeId" = ${parseInt(feeTypeId)}`);
  }

  if (search) {
    conditions.push(Prisma.sql`(c.name ILIKE ${`%${search}%`} OR ft.name ILIKE ${`%${search}%`})`);
  }

  if (role === "parent") {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1
      FROM "Student" s
      WHERE s."classId" = c.id
        AND s."parentId" = ${currentUserId}
    )`);
  }

  // Create the final WHERE clause
  const whereClauseSql = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;

  // Get data
  const { fees, count } = await getFeesData(whereClauseSql, p);
  const { classes, feeTypes } = await getClassesAndFeeTypes(schoolFilter.schoolId || undefined);

  return (
    <div>      
      <FeesManagement
        data={fees}
        count={Number(count[0]?.count) || 0}
        classes={classes}
        feeTypes={feeTypes}
        page={p}
        role={role}
      />
    </div>
  );
};

export default FeesPage;
