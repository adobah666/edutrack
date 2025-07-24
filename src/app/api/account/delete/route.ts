import { NextRequest, NextResponse } from "next/server";
import { deleteAccount } from "@/lib/actions";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await deleteAccount(
      { success: false, error: false },
      formData
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, message: result.message || "Failed to delete" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}