"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "./prisma";

export async function getCurrentUserSchool() {
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

  throw new Error("User role not found");
}

export async function requireSchoolAccess(schoolId?: string) {
  const userContext = await getCurrentUserSchool();
  
  if (userContext.canAccessAllSchools) {
    return userContext; // Super admin can access everything
  }

  if (schoolId && userContext.schoolId !== schoolId) {
    throw new Error("Access denied: You don't have permission to access this school's data");
  }

  return userContext;
}

export async function getSchoolFilter() {
  const userContext = await getCurrentUserSchool();
  
  if (userContext.canAccessAllSchools) {
    return {}; // No filter for super admin
  }

  return { schoolId: userContext.schoolId };
}