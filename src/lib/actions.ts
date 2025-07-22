"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import {
  ClassSchema,
  ExamSchema,
  ParentSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { LessonSchema } from "./formValidationSchemas";
import { Day, Priority } from "./prismaEnums";
import { AssignmentSchema } from "./formValidationSchemas";
import { ResultSchema, AttendanceSchema } from "./formValidationSchemas";
import { EventSchema } from "./formValidationSchemas";
import { AnnouncementSchema } from "./formValidationSchemas";
import { getCurrentUserSchool, requireSchoolAccess } from "./school-context";

type CurrentState = { success: boolean; error: boolean; message?: string };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    // Get the current user's school context
    const userContext = await getCurrentUserSchool();
    
    if (!userContext.schoolId && !userContext.canAccessAllSchools) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Use the user's school ID, or if super admin, require schoolId in data
    const schoolId = userContext.schoolId || data.schoolId;
    
    if (!schoolId) {
      return { success: false, error: true, message: "School ID is required" };
    }

    await prisma.subject.create({
      data: {
        name: data.name,
        schoolId,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  let createdClerkUser = null;

  try {
    // FIRST: Validate school context before doing anything else
    const userContext = await getCurrentUserSchool();
    
    if (!userContext.schoolId && !userContext.canAccessAllSchools) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Use the user's school ID, or if super admin, require schoolId in data
    const schoolId = userContext.schoolId || data.schoolId;
    
    if (!schoolId) {
      return { success: false, error: true, message: "School ID is required" };
    }

    // SECOND: Check if username exists
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

    // THIRD: Check if email exists (if provided)
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

    // FOURTH: Create user in Clerk
    createdClerkUser = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      ...(data.email && { emailAddress: [data.email] }),
      publicMetadata: { role: "parent" },
    });

    // Create parent in database
    await prisma.parent.create({
      data: {
        id: createdClerkUser.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
        img: data.img || null,
        schoolId,
      },
    });

    // Link students if provided
    if (data.studentIds?.length > 0) {
      await prisma.student.updateMany({
        where: { id: { in: data.studentIds } },
        data: { parentId: createdClerkUser.id },
      });
    }

    return {
      success: true,
      error: false,
      message: "Parent created successfully",
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

    console.error("Error in createParent:", err);
    const errorMessage =
      err instanceof Error
        ? err.message
        : "An error occurred while creating the parent";
    return { success: false, error: true, message: errorMessage };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    // Get the current user's school context
    const userContext = await getCurrentUserSchool();
    
    if (!userContext.schoolId && !userContext.canAccessAllSchools) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Use the user's school ID, or if super admin, require schoolId in data
    const schoolId = userContext.schoolId || data.schoolId;
    
    if (!schoolId) {
      return { success: false, error: true, message: "School ID is required" };
    }

    await prisma.class.create({
      data: {
        ...data,
        schoolId,
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  let createdClerkUser = null;

  try {
    // FIRST: Validate school context before doing anything else
    const userContext = await getCurrentUserSchool();
    
    if (!userContext.schoolId && !userContext.canAccessAllSchools) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Use the user's school ID, or if super admin, require schoolId in data
    const schoolId = userContext.schoolId || data.schoolId;
    
    if (!schoolId) {
      return { success: false, error: true, message: "School ID is required" };
    }

    // SECOND: Check if username already exists
    try {
      const existingUsers = await clerkClient.users.getUserList({
        username: [data.username],
      });
      if (existingUsers.totalCount > 0) {
        return {
          success: false,
          error: true,
          message: "That username is taken. Please try another.",
        };
      }
    } catch (error) {
      console.error("Error checking username:", error);
      return {
        success: false,
        error: true,
        message: "Error validating username",
      };
    }

    // THIRD: Check if email already exists (if provided)
    if (data.email) {
      try {
        const existingUsers = await clerkClient.users.getUserList({
          emailAddress: [data.email],
        });
        if (existingUsers.totalCount > 0) {
          return {
            success: false,
            error: true,
            message: "That email is already registered. Please use a different email.",
          };
        }
      } catch (error) {
        console.error("Error checking email:", error);
        return {
          success: false,
          error: true,
          message: "Error validating email",
        };
      }
    }

    try {
      // If all validations pass, create the user
      createdClerkUser = await clerkClient.users.createUser({
        username: data.username,
        password: data.password,
        firstName: data.name,
        lastName: data.surname,
        ...(data.email && { emailAddress: [data.email] }),
        publicMetadata: { role: "teacher" },
      });
    } catch (error) {
      console.error("Error creating user in Clerk:", error);
      
      // Extract specific error message from Clerk's error structure
      let errorMessage = "Error creating user account";
      
      if (error && typeof error === 'object' && 'errors' in error) {
        const clerkError = error as any;
        if (clerkError.errors && clerkError.errors.length > 0) {
          const firstError = clerkError.errors[0];
          if (firstError.message) {
            errorMessage = firstError.message;
          } else if (firstError.longMessage) {
            errorMessage = firstError.longMessage;
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: true,
        message: errorMessage,
      };
    }

    try {
      // If we got here, user creation succeeded, now create the teacher record
      await prisma.teacher.create({
        data: {
          id: createdClerkUser.id,
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address,
          img: data.img || null,
          bloodType: data.bloodType,
          sex: data.sex,
          birthday: data.birthday,
          schoolId, // Use the schoolId validated at the beginning
          subjects: {
            connect: data.subjects?.map((subjectId: string) => ({
              id: parseInt(subjectId),
            })),
          },
        },
      });

      return { success: true, error: false };
    } catch (error) {
      // If teacher creation in database fails, cleanup the Clerk user
      if (createdClerkUser) {
        try {
          await clerkClient.users.deleteUser(createdClerkUser.id);
        } catch (cleanupError) {
          console.error("Error cleaning up Clerk user:", cleanupError);
        }
      }
      throw error; // Re-throw to be caught by outer catch
    }
  } catch (err) {
    console.error("Error in createTeacher:", err);
    return {
      success: false,
      error: true,
      message:
        err instanceof Error ? err.message : "An error occurred while creating the teacher",
    };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // First, handle all foreign key relationships
      
      // 1. Delete or reassign lessons taught by this teacher
      await tx.lesson.deleteMany({
        where: { teacherId: id },
      });

      // 2. Delete assignments created by this teacher
      await tx.assignment.deleteMany({
        where: { teacherId: id },
      });

      // 3. Remove teacher as supervisor from classes (set to null)
      await tx.class.updateMany({
        where: { supervisorId: id },
        data: { supervisorId: null },
      });

      // 4. Delete announcements made by this teacher
      await tx.announcement.deleteMany({
        where: { teacherId: id },
      });

      // 5. Disconnect from subjects (many-to-many relationship)
      await tx.teacher.update({
        where: { id },
        data: {
          subjects: {
            set: [], // Remove all subject connections
          },
        },
      });

      // 6. Finally, delete the teacher
      await tx.teacher.delete({
        where: { id },
      });
    });

    // After successful database deletion, try to delete from Clerk
    try {
      await clerkClient().users.deleteUser(id);
    } catch (error) {
      // If Clerk user not found, just log it - database deletion was successful
      console.log("Clerk user not found, but database deletion completed successfully");
    }

    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting teacher:", err);
    return { success: false, error: true, message: "Failed to delete teacher" };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  let createdClerkUser = null;

  try {
    // FIRST: Validate school context before doing anything else
    const userContext = await getCurrentUserSchool();
    
    if (!userContext.schoolId && !userContext.canAccessAllSchools) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Use the user's school ID, or if super admin, require schoolId in data
    const schoolId = userContext.schoolId || data.schoolId;
    
    if (!schoolId) {
      return { success: false, error: true, message: "School ID is required" };
    }

    // SECOND: Check if username already exists
    try {
      const existingUsers = await clerkClient.users.getUserList({
        username: [data.username],
      });
      if (existingUsers.totalCount > 0) {
        return {
          success: false,
          error: true,
          message: "That username is taken. Please try another.",
        };
      }
    } catch (error) {
      console.error("Error checking username:", error);
      return {
        success: false,
        error: true,
        message: "Error validating username",
      };
    }

    // THIRD: Check class capacity
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: true, message: "Class is at full capacity" };
    }

    try {
      // If all validations pass, create the user in Clerk
      const timestamp = Date.now();
      createdClerkUser = await clerkClient.users.createUser({
        username: data.username,
        password: data.password,
        firstName: data.name,
        lastName: data.surname,
        publicMetadata: { role: "student" },
        emailAddress: [`student${timestamp}@gmail.com`], // Unique email using timestamp
      });
    } catch (error) {
      console.error("Error creating user in Clerk:", error);
      
      // Extract specific error message from Clerk's error structure
      let errorMessage = "Error creating user account";
      
      if (error && typeof error === 'object' && 'errors' in error) {
        const clerkError = error as any;
        if (clerkError.errors && clerkError.errors.length > 0) {
          const firstError = clerkError.errors[0];
          if (firstError.message) {
            errorMessage = firstError.message;
          } else if (firstError.longMessage) {
            errorMessage = firstError.longMessage;
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: true,
        message: errorMessage,
      };
    }

    try {
      // Get the current user's school context
      const userContext = await getCurrentUserSchool();
      
      if (!userContext.schoolId && !userContext.canAccessAllSchools) {
        return { success: false, error: true, message: "School context not found" };
      }

      // Use the user's school ID, or if super admin, require schoolId in data
      const schoolId = userContext.schoolId || data.schoolId;
      
      if (!schoolId) {
        return { success: false, error: true, message: "School ID is required" };
      }

      // If user creation succeeded, create the student record
      await prisma.student.create({
        data: {
          id: createdClerkUser.id,
          username: data.username,
          name: data.name,
          surname: data.surname,
          address: data.address,
          img: data.img || null,
          bloodType: data.bloodType,
          sex: data.sex,
          birthday: data.birthday,
          gradeId: data.gradeId,
          classId: data.classId,
          parentId: data.parentId,
          schoolId,
        },
      });

      return { success: true, error: false };
    } catch (error) {
      // If student creation fails, cleanup the Clerk user
      if (createdClerkUser) {
        try {
          await clerkClient.users.deleteUser(createdClerkUser.id);
        } catch (cleanupError) {
          console.error("Error cleaning up Clerk user:", cleanupError);
        }
      }
      throw error; // Re-throw to be caught by outer catch
    }
  } catch (err) {
    console.error("Error in createStudent:", err);
    return {
      success: false,
      error: true,
      message:
        err instanceof Error ? err.message : "An error occurred while creating the student",
    };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true, message: "Student ID is required" };
  }

  try {
    // Format data for Clerk API update
    const clerkUpdateData: any = {
      username: data.username,
      firstName: data.name,
      lastName: data.surname,
    };

    // Only include password if it's been changed
    if (data.password && data.password !== "") {
      clerkUpdateData.password = data.password;
    }

    // Update user in Clerk
    const user = await clerkClient.users.updateUser(data.id, clerkUpdateData);

    // Update student in your database
    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    // Provide more helpful error message
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    return {
      success: false,
      error: true,
      message: errorMessage,
    };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    // Delete dependent records first
    await prisma.attendance.deleteMany({
      where: { studentId: id },
    });

    await prisma.result.deleteMany({
      where: { studentId: id },
    });

    // Delete the student
    await prisma.student.delete({
      where: { id },
    });

    // Delete Clerk user after successful database deletion
    await clerkClient.users.deleteUser(id);

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        term: data.term,
        subject: {
          connect: { id: data.subjectId },
        },
        class: {
          connect: { id: data.classId },
        },
      },
    });

    // revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    await prisma.exam.update({
      where: {
        id: data.id!,
      },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        term: data.term,
        subject: {
          connect: { id: data.subjectId },
        },
        class: {
          connect: { id: data.classId },
        },
      },
    });

    // revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  try {
    // Create ISO DateTime strings for start and end times by combining today's date with input times
    const [startHour, startMinute] = data.startTime.split(":");
    const [endHour, endMinute] = data.endTime.split(":");

    // Create Date objects based on UTC to avoid timezone issues
    const startTime = new Date();
    startTime.setUTCHours(parseInt(startHour), parseInt(startMinute), 0, 0);

    const endTime = new Date();
    endTime.setUTCHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    // Check for class schedule conflicts
    const classConflict = await prisma.lesson.findFirst({
      where: {
        classId: data.classId,
        day: data.day as Day,
        NOT: { id: data.id }, // Exclude current lesson for updates
        OR: [
          {
            // New lesson starts during an existing lesson
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            // New lesson ends during an existing lesson
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            // New lesson completely contains an existing lesson
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (classConflict) {
      return {
        success: false,
        error: true,
        message: "This class already has a lesson scheduled during this time.",
      };
    }

    // Check for teacher schedule conflicts
    const teacherConflict = await prisma.lesson.findFirst({
      where: {
        teacherId: data.teacherId,
        day: data.day as Day,
        NOT: { id: data.id }, // Exclude current lesson for updates
        OR: [
          {
            // New lesson starts during an existing lesson
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            // New lesson ends during an existing lesson
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            // New lesson completely contains an existing lesson
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
      include: {
        class: { select: { name: true } },
      },
    });

    if (teacherConflict) {
      return {
        success: false,
        error: true,
        message: `The teacher already has a lesson with class ${teacherConflict.class.name} during this time.`,
      };
    }

    await prisma.lesson.create({
      data: {
        name: data.title, // map title to name
        day: data.day as Day,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        subject: {
          connect: { id: data.subjectId },
        },
        class: {
          connect: { id: data.classId },
        },
        teacher: {
          connect: { id: data.teacherId },
        },
      },
    });

    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  try {
    if (!data.id) {
      return {
        success: false,
        error: true,
        message: "Lesson ID is required for update",
      };
    }

    // Create ISO DateTime strings for start and end times by combining today's date with input times
    const [startHour, startMinute] = data.startTime.split(":");
    const [endHour, endMinute] = data.endTime.split(":");

    // Create Date objects based on UTC to avoid timezone issues
    const startTime = new Date();
    startTime.setUTCHours(parseInt(startHour), parseInt(startMinute), 0, 0);

    const endTime = new Date();
    endTime.setUTCHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    // Check for class schedule conflicts
    const classConflict = await prisma.lesson.findFirst({
      where: {
        classId: data.classId,
        day: data.day as Day,
        NOT: { id: data.id }, // Exclude current lesson for updates
        OR: [
          {
            // New lesson starts during an existing lesson
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            // New lesson ends during an existing lesson
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            // New lesson completely contains an existing lesson
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (classConflict) {
      return {
        success: false,
        error: true,
        message: "This class already has a lesson scheduled during this time.",
      };
    }

    // Check for teacher schedule conflicts
    const teacherConflict = await prisma.lesson.findFirst({
      where: {
        teacherId: data.teacherId,
        day: data.day as Day,
        NOT: { id: data.id }, // Exclude current lesson for updates
        OR: [
          {
            // New lesson starts during an existing lesson
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            // New lesson ends during an existing lesson
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            // New lesson completely contains an existing lesson
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
      include: {
        class: { select: { name: true } },
      },
    });

    if (teacherConflict) {
      return {
        success: false,
        error: true,
        message: `The teacher already has a lesson with class ${teacherConflict.class.name} during this time.`,
      };
    }

    await prisma.lesson.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.title, // map title to name
        day: data.day as Day,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        subject: {
          connect: { id: data.subjectId },
        },
        class: {
          connect: { id: data.classId },
        },
        teacher: {
          connect: { id: data.teacherId },
        },
      },
    });

    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.lesson.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  try {
    await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: data.startDate || new Date(),
        dueDate: data.dueDate,
        maxPoints: data.maxPoints,
        class: {
          connect: { id: data.classId },
        },
        subject: {
          connect: { id: data.subjectId },
        },
        teacher: {
          connect: { id: data.teacherId },
        },
      },
    });

    // revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  try {
    await prisma.assignment.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description,
        startDate: data.startDate || new Date(),
        dueDate: data.dueDate,
        maxPoints: data.maxPoints,
        class: {
          connect: { id: data.classId },
        },
        subject: {
          connect: { id: data.subjectId },
        },
        teacher: {
          connect: { id: data.teacherId },
        },
      },
    });

    // revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Add these functions to your actions.js file

export const createAttendance = async (
  currentState: CurrentState,
  data: AttendanceSchema
) => {
  try {
    console.log("Creating/updating attendance records:", {
      date: data.date,
      classId: data.classId,
      studentCount: data.students.length,
    });

    // Use upsert to handle existing records
    const results = await prisma.$transaction(
      data.students.map((student) =>
        prisma.attendance.upsert({
          where: {
            studentId_date_classId: {
              studentId: student.id,
              date: data.date,
              classId: data.classId,
            },
          },
          create: {
            date: data.date,
            present: student.isPresent,
            student: {
              connect: { id: student.id },
            },
            class: {
              connect: { id: data.classId },
            },
          },
          update: {
            present: student.isPresent,
          },
        })
      )
    );

    console.log("Successfully created/updated attendance records:", results.length);

    revalidatePath("/list/attendance");
    revalidatePath("/attendance");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const updateAttendance = async (
  currentState: CurrentState,
  data: AttendanceSchema
) => {
  try {
    // Delete existing attendance records for this class and date
    await prisma.attendance.deleteMany({
      where: {
        classId: data.classId,
        date: data.date,
      },
    });

    // Create new attendance records
    await prisma.$transaction(
      data.students.map((student) =>
        prisma.attendance.create({
          data: {
            date: data.date,
            present: student.isPresent,
            student: {
              connect: { id: student.id },
            },
            class: {
              connect: { id: data.classId },
            },
          },
        })
      )
    );

    revalidatePath("/list/attendance");
    revalidatePath("/attendance");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const deleteAttendance = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.attendance.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createResult = async (
  currentState: CurrentState,
  data: ResultSchema
) => {
  try {
    await prisma.result.create({
      data: {
        score: data.score,
        feedback: data.feedback || null,
        exam: {
          connect: { id: data.examId },
        },
        student: {
          connect: { id: data.studentId },
        },
      },
    });

    // revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateResult = async (
  currentState: CurrentState,
  data: ResultSchema
) => {
  try {
    await prisma.result.update({
      where: {
        id: data.id,
      },
      data: {
        score: data.score,
        feedback: data.feedback || null,
        exam: {
          connect: { id: data.examId },
        },
        student: {
          connect: { id: data.studentId },
        },
      },
    });

    // revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteResult = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.result.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createEvent = async (
  currentState: CurrentState,
  data: EventSchema
) => {
  try {
    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        classId: data.classId || null,
      },
    });

    // revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateEvent = async (
  currentState: CurrentState,
  data: EventSchema
) => {
  try {
    await prisma.event.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        classId: data.classId || null,
      },
    });

    // revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export async function createAnnouncement(prevState: any, formData: AnnouncementSchema) {
  try {
    // Ensure description is present in the payload
    const description = formData.description;

    // Prepare the class connection only if classId exists
    const classConnect = formData.classId
      ? { class: { connect: { id: parseInt(formData.classId) } } }
      : {};

    const result = await prisma.announcement.create({
      data: {
        title: formData.title,
        description: description, // Add the required description field
        date: new Date(formData.date),
        priority: formData.priority as Priority,
        teacher: {
          connect: {
            id: formData.teacherId
          }
        },
        ...classConnect
      },
    });

    return {
      success: true,
      error: false,
    };
  } catch (error) {
    console.error("Error creating announcement:", error);
    return {
      success: false,
      error: true,
    };
  }
}

// Similarly, update the updateAnnouncement function:
export async function updateAnnouncement(prevState: any, formData: AnnouncementSchema) {
  try {
    // Ensure description is present in the payload
    const description = formData.description;

    // Prepare the class connection only if classId exists
    const classConnect = formData.classId
      ? { class: { connect: { id: parseInt(formData.classId) } } }
      : {};

    // Disconnect class if classId is empty and was previously set
    const classDisconnect = !formData.classId
      ? { class: { disconnect: true } }
      : {};

    const result = await prisma.announcement.update({
      where: {
        id: formData.id ? parseInt(formData.id) : undefined,
      },
      data: {
        title: formData.title,
        description: description, // Add the required description field
        date: new Date(formData.date),
        priority: formData.priority as Priority,
        teacher: {
          connect: {
            id: formData.teacherId
          }
        },
        ...(formData.classId ? classConnect : classDisconnect)
      },
    });

    return {
      success: true,
      error: false,
    };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return {
      success: false,
      error: true,
    };
  }
}

export const deleteAnnouncement = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.announcement.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.assignment.delete({
      where: {
        id: parseInt(id),
      },
    });
    // revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteEvent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.event.delete({
      where: {
        id: parseInt(id),
      },
    });
    // revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export async function getClasses() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        supervisor: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: classes,
    };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch classes",
      data: [],
    };
  }
}

export async function fetchStudents() {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        classId: true,
      },
      orderBy: [
        { name: "asc" },
        { surname: "asc" },
      ],
    });

    return students;
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
}

export async function fetchExams() {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    const query = {
      where:
        role === "teacher" && userId
          ? {
              subject: {
                teachers: {
                  some: {
                    id: userId,
                  },
                },
              },
            }
          : undefined,
      select: {
        id: true,
        title: true,
        classId: true,
        subject: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    } as const;

    const exams = await prisma.exam.findMany(query);

    return exams.map((exam) => ({
      id: exam.id,
      title: `${exam.title} (${exam.subject?.name || "No Subject"})`,
      classId: exam.classId,
    }));
  } catch (error) {
    console.error("Error fetching exams:", error);
    return [];
  }
}

/**
 * Fetches all teachers from the database
 */
export async function getTeachers() {
  try {
    const teachers = await prisma.teacher.findMany({
      orderBy: [
        { name: "asc" },
        { surname: "asc" },
      ],
    });

    return {
      success: true,
      data: teachers,
    };
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch teachers",
      data: [],
    };
  }
}

export const updateParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  try {
    // Update user in Clerk if password or email changed
    if (data.password || data.email) {
      await clerkClient.users.updateUser(data.id!, {
        ...(data.password && { password: data.password }),
        ...(data.email && { emailAddress: [data.email] }),
      });
    }

    // Get existing students for this parent
    const existingStudents = await prisma.student.findMany({
      where: { parentId: data.id },
    });
    const existingStudentIds = existingStudents.map((s) => s.id.toString());

    // Convert all student IDs to strings and filter out any invalid values
    const newStudentIds = (data.studentIds || []).map((id) => id.toString());

    // Find students to remove (exist in existing but not in new)
    const studentsToRemove = existingStudentIds.filter(
      (id) => !newStudentIds.includes(id)
    );

    // Find students to add (exist in new but not in existing)
    const studentsToAdd = newStudentIds.filter(
      (id) => !existingStudentIds.includes(id)
    );

    // Update parent record first
    await prisma.parent.update({
      where: { id: data.id },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
        img: data.img || null,
      },
    });

    // Remove students that should no longer be associated
    if (studentsToRemove.length > 0) {
      await prisma.student.updateMany({
        where: {
          id: { in: studentsToRemove },
          parentId: data.id, // Only update if they're actually connected to this parent
        },
        data: { parentId: null },
      });
    }

    // Add new student connections
    if (studentsToAdd.length > 0) {
      await prisma.student.updateMany({
        where: {
          id: { in: studentsToAdd },
          parentId: null, // Only update students that don't have a parent
        },
        data: { parentId: data.id },
      });
    }

    return { success: true, error: false };
  } catch (err) {
    console.error("Update parent error:", err);
    return {
      success: false,
      error: true,
      message: err instanceof Error ? err.message : "Failed to update parent",
    };
  }
};