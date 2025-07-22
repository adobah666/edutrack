"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { getCurrentUserSchool, requireSchoolAccess } from "./school-context";
import { z } from "zod";

type CurrentState = { success: boolean; error: boolean; message?: string };

// School Schema
const SchoolSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "School name is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
  phone: z.string().optional(),
  email: z.string().email({ message: "Invalid email address!" }).optional().or(z.literal("")),
  logo: z.string().optional(),
});

// Admin Schema
const AdminSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, { message: "Username must be at least 3 characters long!" }),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z.string().email({ message: "Invalid email address!" }).optional().or(z.literal("")),
  password: z.string().min(8, { message: "Password must be at least 8 characters long!" }),
  role: z.enum(["SUPER_ADMIN", "SCHOOL_ADMIN"], {
    message: "Role is required!",
  }),
  schoolId: z.string().optional(),
});

type SchoolSchemaType = z.infer<typeof SchoolSchema>;
type AdminSchemaType = z.infer<typeof AdminSchema>;

// School Actions
export const createSchool = async (
  currentState: CurrentState,
  data: SchoolSchemaType
) => {
  try {
    // Only super admins can create schools
    const userContext = await getCurrentUserSchool();
    if (!userContext.canAccessAllSchools) {
      return {
        success: false,
        error: true,
        message: "Access denied: Only super admins can create schools",
      };
    }

    await prisma.school.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone || null,
        email: data.email || null,
        logo: data.logo || null,
      },
    });

    revalidatePath("/list/schools");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error creating school:", err);
    return { success: false, error: true };
  }
};

export const updateSchool = async (
  currentState: CurrentState,
  data: SchoolSchemaType
) => {
  try {
    if (!data.id) {
      return { success: false, error: true, message: "School ID is required" };
    }

    // Only super admins can update schools
    const userContext = await getCurrentUserSchool();
    if (!userContext.canAccessAllSchools) {
      return {
        success: false,
        error: true,
        message: "Access denied: Only super admins can update schools",
      };
    }

    await prisma.school.update({
      where: { id: data.id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone || null,
        email: data.email || null,
        logo: data.logo || null,
      },
    });

    revalidatePath("/list/schools");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error updating school:", err);
    return { success: false, error: true };
  }
};

export const deleteSchool = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  
  try {
    // Only super admins can delete schools
    const userContext = await getCurrentUserSchool();
    if (!userContext.canAccessAllSchools) {
      return {
        success: false,
        error: true,
        message: "Access denied: Only super admins can delete schools",
      };
    }

    // Check if school has any data
    const schoolData = await prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            parents: true,
            admins: true,
          },
        },
      },
    });

    if (!schoolData) {
      return { success: false, error: true, message: "School not found" };
    }

    const totalRecords = 
      schoolData._count.students + 
      schoolData._count.teachers + 
      schoolData._count.parents + 
      schoolData._count.admins;

    if (totalRecords > 0) {
      return {
        success: false,
        error: true,
        message: "Cannot delete school with existing data. Please transfer or delete all users first.",
      };
    }

    await prisma.school.delete({
      where: { id },
    });

    revalidatePath("/list/schools");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting school:", err);
    return { success: false, error: true };
  }
};

// Admin Actions
export const createAdmin = async (
  currentState: CurrentState,
  data: AdminSchemaType
) => {
  let createdClerkUser = null;

  try {
    // Only super admins can create admins
    const userContext = await getCurrentUserSchool();
    if (!userContext.canAccessAllSchools) {
      return {
        success: false,
        error: true,
        message: "Access denied: Only super admins can create admins",
      };
    }

    // Validate school assignment for school admins
    if (data.role === "SCHOOL_ADMIN" && !data.schoolId) {
      return {
        success: false,
        error: true,
        message: "School assignment is required for school admins",
      };
    }

    // Check if username exists
    const existingUsersByUsername = await clerkClient.users.getUserList({
      username: [data.username],
    });
    if (existingUsersByUsername.totalCount > 0) {
      return {
        success: false,
        error: true,
        message: "That username is taken. Please try another.",
      };
    }

    // Check if email exists (if provided)
    if (data.email) {
      const existingUsersByEmail = await clerkClient.users.getUserList({
        emailAddress: [data.email],
      });
      if (existingUsersByEmail.totalCount > 0) {
        return {
          success: false,
          error: true,
          message: "That email is already registered. Please use a different email.",
        };
      }
    }

    // Create user in Clerk
    createdClerkUser = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      ...(data.email && { emailAddress: [data.email] }),
      publicMetadata: { role: "admin", adminRole: data.role },
    });

    // Create admin in database
    await prisma.admin.create({
      data: {
        id: createdClerkUser.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        role: data.role,
        schoolId: data.role === "SCHOOL_ADMIN" ? data.schoolId : null,
      },
    });

    revalidatePath("/list/admins");
    return {
      success: true,
      error: false,
      message: "Admin created successfully",
    };
  } catch (err) {
    // If anything fails and we created a Clerk user, clean it up
    if (createdClerkUser) {
      try {
        await clerkClient.users.deleteUser(createdClerkUser.id);
      } catch (cleanupError) {
        console.error("Error cleaning up Clerk user:", cleanupError);
      }
    }

    console.error("Error in createAdmin:", err);
    const errorMessage =
      err instanceof Error
        ? err.message
        : "An error occurred while creating the admin";
    return { success: false, error: true, message: errorMessage };
  }
};

export const updateAdmin = async (
  currentState: CurrentState,
  data: AdminSchemaType
) => {
  try {
    if (!data.id) {
      return { success: false, error: true, message: "Admin ID is required" };
    }

    // Only super admins can update admins
    const userContext = await getCurrentUserSchool();
    if (!userContext.canAccessAllSchools) {
      return {
        success: false,
        error: true,
        message: "Access denied: Only super admins can update admins",
      };
    }

    // Validate school assignment for school admins
    if (data.role === "SCHOOL_ADMIN" && !data.schoolId) {
      return {
        success: false,
        error: true,
        message: "School assignment is required for school admins",
      };
    }

    // Update user in Clerk
    const clerkUpdateData: any = {
      username: data.username,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "admin", adminRole: data.role },
    };

    // Only include password if it's been changed
    if (data.password && data.password !== "") {
      clerkUpdateData.password = data.password;
    }

    await clerkClient.users.updateUser(data.id, clerkUpdateData);

    // Update admin in database
    await prisma.admin.update({
      where: { id: data.id },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        role: data.role,
        schoolId: data.role === "SCHOOL_ADMIN" ? data.schoolId : null,
      },
    });

    revalidatePath("/list/admins");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error updating admin:", err);
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    return {
      success: false,
      error: true,
      message: errorMessage,
    };
  }
};

export const deleteAdmin = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  
  try {
    // Only super admins can delete admins
    const userContext = await getCurrentUserSchool();
    if (!userContext.canAccessAllSchools) {
      return {
        success: false,
        error: true,
        message: "Access denied: Only super admins can delete admins",
      };
    }

    // Prevent deleting yourself
    const { userId } = await auth();
    if (userId === id) {
      return {
        success: false,
        error: true,
        message: "You cannot delete your own admin account",
      };
    }

    // Delete admin from database
    await prisma.admin.delete({
      where: { id },
    });

    // Delete Clerk user
    await clerkClient.users.deleteUser(id);

    revalidatePath("/list/admins");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting admin:", err);
    return { success: false, error: true };
  }
};