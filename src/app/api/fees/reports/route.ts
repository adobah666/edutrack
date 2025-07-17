// src/app/api/fees/reports/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { generateFeeReport } from "@/lib/reportsService";

export async function GET(req: NextRequest) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // Only admin can access reports
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Get filters from query parameters
    const searchParams = req.nextUrl.searchParams;
    const filters: any = {};

    // Parse date filters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    // Parse other filters
    const classId = searchParams.get('classId');
    const feeTypeId = searchParams.get('feeTypeId');
    if (classId) filters.classId = parseInt(classId);
    if (feeTypeId) filters.feeTypeId = parseInt(feeTypeId);

    // Generate report
    const report = await generateFeeReport(filters);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Error generating fee report:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
