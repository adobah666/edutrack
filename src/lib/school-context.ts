"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "./prisma";

export async function getCurrentUserSchool() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Check if user is a super admin
    const admin = await prisma.admin.findUnique({
      where: { id: userId },
      include: { school: true }
    });

    if (admin) {
      if (admin.role === "SUPER_ADMIN") {
        return { 
          schoolId: null, 
          role: "SUPER_ADMIN" as const,
          canAccessAllSchools: true 
        };
      }
      return { 
        schoolId: admin.schoolId, 
        role: "SCHOOL_ADMIN" as const,
        canAccessAllSchools: false 
      };
    }

    // Check if user is a teacher, student, or parent
    const teacher = await prisma.teacher.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });

    if (teacher) {
      return { 
        schoolId: teacher.schoolId, 
        role: "TEACHER" as const,
        canAccessAllSchools: false 
      };
    }

    const student = await prisma.student.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });

    if (student) {
      return { 
        schoolId: student.schoolId, 
        role: "STUDENT" as const,
        canAccessAllSchools: false 
      };
    }

    const parent = await prisma.parent.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });

    if (parent) {
      return { 
        schoolId: parent.schoolId, 
        role: "PARENT" as const,
        canAccessAllSchools: false 
      };
    }

    // If we get here, the user exists in Clerk but not in our database
    // This could happen if the user was deleted from our database but still has a Clerk session
    console.warn(`User ${userId} found in Clerk but not in database - possible orphaned session`);
    throw new Error("User not found in database - please log in again");
    
  } catch (error) {
    // If it's already an authentication error, re-throw it
    if (error instanceof Error && (
      error.message.includes("User not authenticated") ||
      error.message.includes("User not found in database")
    )) {
      throw error;
    }
    
    // For other errors, wrap them in a more descriptive error
    console.error("Error in getCurrentUserSchool:", error);
    throw new Error("Authentication error - please log in again");
  }
}

export async function requireSchoolAccess(schoolId?: string) {
  try {
    const userContext = await getCurrentUserSchool();
    
    if (userContext.canAccessAllSchools) {
      return userContext; // Super admin can access everything
    }

    if (schoolId && userContext.schoolId !== schoolId) {
      throw new Error("Access denied: You don't have permission to access this school's data");
    }

    return userContext;
  } catch (error) {
    // Re-throw authentication errors as-is
    if (error instanceof Error && error.message.includes("Authentication error")) {
      throw error;
    }
    throw error;
  }
}

export async function getSchoolFilter() {
  try {
    const userContext = await getCurrentUserSchool();
    
    if (userContext.canAccessAllSchools) {
      return {}; // No filter for super admin
    }

    return { schoolId: userContext.schoolId };
  } catch (error) {
    // If there's an authentication error, throw it to trigger logout
    console.warn("Authentication error in getSchoolFilter:", error);
    throw error; // This will trigger the AuthErrorHandler to logout the user
  }
}