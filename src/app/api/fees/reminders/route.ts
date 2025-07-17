// src/app/api/fees/reminders/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { sendPaymentReminders, sendOverduePaymentReminders } from "@/lib/reminderService";

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // Only admin can trigger reminders
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Get the type of reminders to send
    const { type } = await req.json();

    if (type === "upcoming") {
      const result = await sendPaymentReminders();
      return NextResponse.json(result);
    } else if (type === "overdue") {
      const result = await sendOverduePaymentReminders();
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: "Invalid reminder type" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error in payment reminders:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// CRON job endpoint to automatically send reminders
export async function GET(req: NextRequest) {
  try {
    // Verify that this is a CRON job request with a secret token
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Send both types of reminders
    const [upcomingResult, overdueResult] = await Promise.all([
      sendPaymentReminders(),
      sendOverduePaymentReminders(),
    ]);

    return NextResponse.json({
      upcoming: upcomingResult,
      overdue: overdueResult,
    });
  } catch (error: any) {
    console.error("Error in automatic payment reminders:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
