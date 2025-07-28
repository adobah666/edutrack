import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error("Auth test error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
} 