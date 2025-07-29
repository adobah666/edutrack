import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserSchool } from "@/lib/school-context";

export async function POST(request: NextRequest) {
  try {
    const { userId, userType } = await request.json();

    if (!userId || !userType) {
      return NextResponse.json(
        { error: "User ID and user type are required" },
        { status: 400 }
      );
    }

    // Validate school context
    const userContext = await getCurrentUserSchool();
    if (!userContext.schoolId) {
      return NextResponse.json(
        { error: "School context not found" },
        { status: 403 }
      );
    }

    let user;
    
    if (userType === "parent") {
      user = await prisma.parent.findFirst({
        where: {
          id: userId,
          schoolId: userContext.schoolId,
        },
        select: {
          id: true,
          username: true,
          password: true,
          name: true,
          surname: true,
          email: true,
          phone: true,
        },
      });
    } else if (userType === "student") {
      user = await prisma.student.findFirst({
        where: {
          id: userId,
          schoolId: userContext.schoolId,
        },
        select: {
          id: true,
          username: true,
          password: true,
          name: true,
          surname: true,
        },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid user type" },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      credentials: {
        username: user.username,
        password: user.password,
        name: user.name,
        surname: user.surname,
        ...(userType === "parent" && { 
          email: (user as any).email,
          phone: (user as any).phone 
        }),
      },
    });

  } catch (error) {
    console.error("Error retrieving user credentials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}