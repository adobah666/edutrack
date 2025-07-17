// src/app/(dashboard)/fees/reports/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import FeesReport from "@/components/FeesReport";

export default async function FeesReportPage() {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Only admin can access reports
  if (role !== "admin") {
    redirect("/dashboard");
  }

  // Get data for filters
  const [classes, feeTypes] = await Promise.all([
    prisma.class.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.feeType.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-4">
      <FeesReport classes={classes} feeTypes={feeTypes} />
    </div>
  );
}
