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
import { getSchoolFilter } from "./school-context";
import { getCurrentUserSchool, requireSchoolAccess } from "./school-context";

type CurrentState = { success: boolean; error: boolean; message?: string };

// Helper function to create username error message with the actual username
function createUsernameErrorMessage(username: string, source: string): string {
  return `Username "${username}" is taken in ${source}. Please try another.`;
}

// Helper function to check if username exists in local database across ALL user types
async function checkLocalUsernameExists(username: string, schoolId: string): Promise<boolean> {
  try {
    console.log(`[HELPER] Checking local database for username: ${username} in school: ${schoolId}`);
    const [student, teacher, parent, admin] = await Promise.all([
      prisma.student.findFirst({ 
        where: { username, schoolId },
        select: { id: true, username: true }
      }),
      prisma.teacher.findFirst({ 
        where: { username, schoolId },
        select: { id: true, username: true }
      }),
      prisma.parent.findFirst({ 
        where: { username, schoolId },
        select: { id: true, username: true }
      }),
      prisma.admin.findFirst({ 
        where: { username, schoolId },
        select: { id: true, username: true }
      })
    ]);

    const exists = !!(student || teacher || parent || admin);
    console.log(`[HELPER] Local database check results for ${username}:`, {
      student: !!student,
      teacher: !!teacher,
      parent: !!parent,
      admin: !!admin,
      exists: exists
    });

    if (student) console.log(`[HELPER] Found student with username ${username}:`, student);
    if (teacher) console.log(`[HELPER] Found teacher with username ${username}:`, teacher);
    if (parent) console.log(`[HELPER] Found parent with username ${username}:`, parent);
    if (admin) console.log(`[HELPER] Found admin with username ${username}:`, admin);

    return exists;
  } catch (error) {
    console.error("[HELPER] Error checking local username:", error);
    return true; // Return true to be safe if there's an error
  }
}

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    // Get the current user's school context
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Use the user's school ID
    const schoolId = userContext.schoolId;

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
  let createdClerkUser: any = null;

  try {
    // FIRST: Validate school context before doing anything else
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Use the user's school ID
    const schoolId = userContext.schoolId;

    if (!schoolId) {
      return { success: false, error: true, message: "School ID is required" };
    }

    // SECOND: Check if username exists in Clerk
    console.log(`[ACTIONS] Checking Clerk for username: ${data.username}`);
    const existingUsersByUsername = await clerkClient.users.getUserList({
      username: [data.username],
    });
    console.log(`[ACTIONS] Clerk check result for ${data.username}: ${existingUsersByUsername.totalCount} users found`);
    if (existingUsersByUsername.totalCount > 0) {
      console.log(`[ACTIONS] Username ${data.username} exists in Clerk - REJECTING`);
      return {
        success: false,
        error: true,
        message: `Username "${data.username}" is taken in Clerk. Please try another.`,
      };
    }

    // ALSO: Check if username exists in local database across ALL user types
    console.log(`[ACTIONS] Checking local database for username: ${data.username} in school: ${schoolId}`);
    const localUsernameExists = await checkLocalUsernameExists(data.username, schoolId);
    console.log(`[ACTIONS] Local database check result for ${data.username}: ${localUsernameExists}`);
    if (localUsernameExists) {
      console.log(`[ACTIONS] Username ${data.username} exists in local database - REJECTING`);
      return {
        success: false,
        error: true,
        message: "That username is taken in local database. Please try another.",
      };
    }

    console.log(`[ACTIONS] Username ${data.username} is available - PROCEEDING`);

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
    const newParent = await prisma.parent.create({
      data: {
        id: createdClerkUser.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
        img: data.img || null,
        password: data.password, // Store password for later retrieval
        schoolId,
      },
      include: {
        school: true
      }
    });

    // Link students if provided (backward compatibility)
    if (data.studentIds?.length > 0) {
      await prisma.parentStudent.createMany({
        data: data.studentIds.map(studentId => ({
          parentId: createdClerkUser.id,
          studentId: studentId,
          relationshipType: 'GUARDIAN' // Default relationship type for backward compatibility
        })),
        skipDuplicates: true,
      });
    }

    // Create parent-student relationships with relationship types if provided
    if (data.parentStudents && data.parentStudents.length > 0) {
      const validAssignments = data.parentStudents.filter(
        (assignment) => assignment.studentId && assignment.relationshipType
      );
      
      if (validAssignments.length > 0) {
        await prisma.parentStudent.createMany({
          data: validAssignments.map((assignment) => ({
            parentId: createdClerkUser.id,
            studentId: assignment.studentId,
            relationshipType: assignment.relationshipType as any,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Send welcome SMS if phone number is provided
    if (data.phone) {
      try {
        const { SMSService } = await import('@/lib/sms-service');
        const welcomeMessage = SMSService.getWelcomeMessage(
          'parent',
          data.name,
          data.username,
          data.password,
          newParent.school.name
        );
        
        await SMSService.sendSMS(data.phone, welcomeMessage);
      } catch (smsError) {
        console.error('Failed to send welcome SMS:', smsError);
        // Don't fail the entire operation if SMS fails
      }
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

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Use the user's school ID
    const schoolId = userContext.schoolId;

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

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Use the user's school ID
    const schoolId = userContext.schoolId;

    if (!schoolId) {
      return { success: false, error: true, message: "School ID is required" };
    }

    // SECOND: Check if username already exists in Clerk
    console.log(`[ACTIONS] Checking Clerk for username: ${data.username}`);
    try {
      const existingUsers = await clerkClient.users.getUserList({
        username: [data.username],
      });
      console.log(`[ACTIONS] Clerk check result for ${data.username}: ${existingUsers.totalCount} users found`);
      if (existingUsers.totalCount > 0) {
        console.log(`[ACTIONS] Username ${data.username} exists in Clerk - REJECTING`);
        return {
          success: false,
          error: true,
          message: "That username is taken in Clerk. Please try another.",
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

    // ALSO: Check if username exists in local database across ALL user types
    console.log(`[ACTIONS] Checking local database for username: ${data.username} in school: ${schoolId}`);
    const localUsernameExists = await checkLocalUsernameExists(data.username, schoolId);
    console.log(`[ACTIONS] Local database check result for ${data.username}: ${localUsernameExists}`);
    if (localUsernameExists) {
      console.log(`[ACTIONS] Username ${data.username} exists in local database - REJECTING`);
      return {
        success: false,
        error: true,
        message: "That username is taken in local database. Please try another.",
      };
    }

    console.log(`[ACTIONS] Username ${data.username} is available - PROCEEDING`);

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
          
          // Handle specific error cases with user-friendly messages
          if (firstError.code === 'form_data_missing') {
            if (firstError.longMessage && firstError.longMessage.includes('email_address')) {
              errorMessage = "Email address is required. Please provide a valid email address for the teacher.";
            } else if (firstError.longMessage && firstError.longMessage.includes('username')) {
              errorMessage = "Username is required. Please provide a valid username for the teacher.";
            } else if (firstError.longMessage && firstError.longMessage.includes('password')) {
              errorMessage = "Password is required. Please provide a valid password for the teacher.";
            } else {
              errorMessage = "Required field is missing. Please check that all required fields are filled out.";
            }
          } else if (firstError.code === 'form_identifier_exists') {
            if (firstError.longMessage && firstError.longMessage.includes('email')) {
              errorMessage = "That email address is already taken. Please use a different email address.";
            } else if (firstError.longMessage && firstError.longMessage.includes('username')) {
              errorMessage = "That username is already taken. Please use a different username.";
            } else {
              errorMessage = "That identifier is already taken. Please try another.";
            }
          } else if (firstError.code === 'form_password_pwned') {
            errorMessage = "This password has been found in a data breach. Please choose a more secure password.";
          } else if (firstError.code === 'form_password_length_too_short') {
            errorMessage = "Password is too short. Please choose a password with at least 8 characters.";
          } else if (firstError.message) {
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
      const teacher = await prisma.teacher.create({
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
        include: {
          school: true
        }
      });

      // Create teacher-subject-class assignments if provided
      console.log('Received teacherSubjectClasses:', data.teacherSubjectClasses); // Debug log
      if (data.teacherSubjectClasses && data.teacherSubjectClasses.length > 0) {
        const validAssignments = data.teacherSubjectClasses.filter(
          (assignment) => assignment.subjectId > 0 && assignment.classId > 0
        );
        
        console.log('Valid assignments to create:', validAssignments); // Debug log
        
        if (validAssignments.length > 0) {
          await prisma.teacherSubjectClass.createMany({
            data: validAssignments.map((assignment) => ({
              teacherId: teacher.id,
              subjectId: assignment.subjectId,
              classId: assignment.classId,
            })),
            skipDuplicates: true, // Prevent duplicate assignments
          });
          console.log('Successfully created teacher-subject-class assignments'); // Debug log
        }
      }

      // Send welcome SMS if phone number is provided
      if (data.phone) {
        try {
          const { SMSService } = await import('@/lib/sms-service');
          const welcomeMessage = SMSService.getWelcomeMessage(
            'teacher',
            data.name,
            data.username,
            data.password,
            teacher.school.name
          );
          
          await SMSService.sendSMS(data.phone, welcomeMessage);
        } catch (smsError) {
          console.error('Failed to send welcome SMS:', smsError);
          // Don't fail the entire operation if SMS fails
        }
      }

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

    // Update teacher-subject-class assignments
    if (data.teacherSubjectClasses !== undefined && data.id) {
      // First, delete existing assignments for this teacher
      await prisma.teacherSubjectClass.deleteMany({
        where: { teacherId: data.id },
      });

      // Then create new assignments if provided
      if (data.teacherSubjectClasses.length > 0) {
        const validAssignments = data.teacherSubjectClasses.filter(
          (assignment) => assignment.subjectId > 0 && assignment.classId > 0
        );
        
        if (validAssignments.length > 0) {
          await prisma.teacherSubjectClass.createMany({
            data: validAssignments.map((assignment) => ({
              teacherId: data.id!,
              subjectId: assignment.subjectId,
              classId: assignment.classId,
            })),
            skipDuplicates: true,
          });
        }
      }
    }
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

      // 5. Delete teacher-subject-class assignments
      await tx.teacherSubjectClass.deleteMany({
        where: { teacherId: id },
      });

      // 6. Disconnect from subjects (many-to-many relationship)
      await tx.teacher.update({
        where: { id },
        data: {
          subjects: {
            set: [], // Remove all subject connections
          },
        },
      });

      // 7. Finally, delete the teacher
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
    // DEBUG: Show the exact username being submitted
    console.error(`[DEBUG] createStudent called with username: "${data.username}" (length: ${data.username.length})`);
    // FIRST: Validate school context before doing anything else
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Use the user's school ID
    const schoolId = userContext.schoolId;

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

      if (!userContext.schoolId) {
        return { success: false, error: true, message: "School context not found" };
      }

      // Use the user's school ID
      const schoolId = userContext.schoolId;

      if (!schoolId) {
        return { success: false, error: true, message: "School ID is required" };
      }

      // If user creation succeeded, create the student record
      const newStudent = await prisma.student.create({
        data: {
          id: createdClerkUser.id,
          username: data.username,
          name: data.name,
          surname: data.surname,
          address: data.address,
          img: data.img || null,
          phone: data.phone || null,
          bloodType: data.bloodType,
          sex: data.sex,
          birthday: data.birthday,
          gradeId: data.gradeId,
          classId: data.classId,
          password: data.password, // Store password for later retrieval
          schoolId,
        },
        include: {
          school: true
        }
      });

      // Send welcome SMS if phone number is provided
      if (data.phone) {
        try {
          const { SMSService } = await import('@/lib/sms-service');
          const welcomeMessage = SMSService.getWelcomeMessage(
            'student',
            data.name,
            data.username,
            data.password,
            newStudent.school.name
          );
          
          await SMSService.sendSMS(data.phone, welcomeMessage);
        } catch (smsError) {
          console.error('Failed to send welcome SMS:', smsError);
          // Don't fail the entire operation if SMS fails
        }
      }

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
        phone: data.phone || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        ...(data.password && data.password !== "" && { password: data.password }), // Update password if provided
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
    // FIRST: Validate school context before doing anything else
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Use the user's school ID
    const schoolId = userContext.schoolId;

    if (!schoolId) {
      return { success: false, error: true, message: "School ID is required" };
    }

    // Create the exam and capture eligible students in a transaction
    await prisma.$transaction(async (tx) => {
      // Create the exam
      const exam = await tx.exam.create({
        data: {
          title: data.title,
          startTime: data.startTime,
          endTime: data.endTime,
          term: data.term,
          maxPoints: data.maxPoints || 100,
          school: {
            connect: { id: schoolId },
          },
          subject: {
            connect: { id: data.subjectId },
          },
          // Keep backward compatibility with single class
          ...(data.classId && { class: { connect: { id: data.classId } } }),
        },
      });

      // Handle multiple classes (new approach) or single class (backward compatibility)
      const classIds = data.classIds && data.classIds.length > 0 ? data.classIds : [data.classId];
      
      // Create exam-class relationships
      const validClassIds = classIds.filter((classId): classId is number => classId !== undefined);
      if (validClassIds.length > 0) {
        await tx.examClass.createMany({
          data: validClassIds.map(classId => ({
            examId: exam.id,
            classId: classId,
          })),
        });
      }

      // Get all current students in the selected classes
      const currentStudents = await tx.student.findMany({
        where: {
          classId: { in: validClassIds },
          schoolId: schoolId,
        },
        select: {
          id: true,
        },
      });

      // Create eligibility records for all current students
      if (currentStudents.length > 0) {
        await tx.examEligibleStudent.createMany({
          data: currentStudents.map(student => ({
            examId: exam.id,
            studentId: student.id,
          })),
        });
      }
    });

    // Send SMS reminders for the exam (optional, could be triggered by a separate job)
    try {
      const { SMSService } = await import('@/lib/sms-service');
      
      // Get school info
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { name: true }
      });

      // Get students from the selected classes
      const validClassIds = data.classIds && data.classIds.length > 0 ? data.classIds : [data.classId];
      const classIds = validClassIds.filter((classId): classId is number => classId !== undefined);
      
      if (classIds.length > 0 && school) {
        const students = await prisma.student.findMany({
          where: {
            classId: { in: classIds },
            schoolId: schoolId,
          },
          select: {
            name: true,
            surname: true,
            phone: true,
            parentStudents: {
              select: {
                parent: {
                  select: {
                    phone: true
                  }
                }
              }
            }
          }
        });

        const examDate = data.startTime.toLocaleDateString();
        
        for (const student of students) {
          const studentName = `${student.name} ${student.surname}`;
          const reminderMessage = SMSService.getExamReminderMessage(
            data.title,
            examDate,
            studentName,
            school.name
          );

          // Get all phone numbers for the student (student + parents)
          const phoneNumbers = SMSService.getStudentPhoneNumbers(student);
          
          // Send SMS to all available phone numbers
          for (const phone of phoneNumbers) {
            await SMSService.sendSMS(phone, reminderMessage);
          }
        }
      }
    } catch (smsError) {
      console.error('Failed to send exam reminder SMS:', smsError);
      // Don't fail the exam creation if SMS fails
    }

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
    // FIRST: Validate school context before doing anything else
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Use the user's school ID
    const schoolId = userContext.schoolId;

    if (!schoolId) {
      return { success: false, error: true, message: "School ID is required" };
    }

    // Get school hours for validation
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { openingTime: true, closingTime: true }
    });

    const schoolHours = school || { openingTime: "08:00", closingTime: "17:00" };

    // Validate lesson times against school hours
    const validateTimeAgainstSchoolHours = (time: string, type: 'start' | 'end') => {
      const timeValue = parseInt(time.replace(':', ''));
      const openingValue = parseInt(schoolHours.openingTime.replace(':', ''));
      const closingValue = parseInt(schoolHours.closingTime.replace(':', ''));
      
      if (timeValue < openingValue || timeValue > closingValue) {
        return `❌ SCHOOL HOURS VIOLATION: ${type === 'start' ? 'Start' : 'End'} time (${time}) is outside school operating hours (${schoolHours.openingTime} - ${schoolHours.closingTime}). Please schedule lessons within school hours.`;
      }
      return null;
    };

    // Validate start and end times
    const startTimeError = validateTimeAgainstSchoolHours(data.startTime, 'start');
    if (startTimeError) {
      return { success: false, error: true, message: startTimeError };
    }

    const endTimeError = validateTimeAgainstSchoolHours(data.endTime, 'end');
    if (endTimeError) {
      return { success: false, error: true, message: endTimeError };
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

    await prisma.lesson.create({
      data: {
        name: data.title, // map title to name
        day: data.day as Day,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        school: {
          connect: { id: schoolId },
        },
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
    // FIRST: Validate school context before doing anything else
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Use the user's school ID
    const schoolId = userContext.schoolId;

    if (!schoolId) {
      return { success: false, error: true, message: "School ID is required" };
    }

    await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: data.startDate || new Date(),
        dueDate: data.dueDate,
        maxPoints: data.maxPoints,
        school: {
          connect: { id: schoolId },
        },
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

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();
    if (!schoolFilter.schoolId) {
      return { success: false, error: true };
    }

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
            studentId: student.id,
            classId: data.classId,
            schoolId: schoolFilter.schoolId!,
          },
          update: {
            present: student.isPresent,
          },
        })
      )
    );

    console.log("Successfully created/updated attendance records:", results.length);

    // Send SMS alerts for absent students
    try {
      const absentStudents = data.students.filter(student => !student.isPresent);
      
      if (absentStudents.length > 0) {
        const { SMSService } = await import('@/lib/sms-service');
        
        // Get school info and student details
        const school = await prisma.school.findUnique({
          where: { id: schoolFilter.schoolId! },
          select: { name: true }
        });

        for (const absentStudent of absentStudents) {
          // Get student details with parent info
          const studentDetails = await prisma.student.findUnique({
            where: { id: absentStudent.id },
            select: {
              name: true,
              surname: true,
              phone: true,
              parentStudents: {
                select: {
                  parent: {
                    select: {
                      phone: true
                    }
                  }
                }
              }
            }
          });

          if (studentDetails) {
            const studentName = `${studentDetails.name} ${studentDetails.surname}`;
            const dateStr = data.date.toLocaleDateString();
            const alertMessage = SMSService.getAttendanceAlertMessage(
              studentName,
              dateStr,
              school?.name || 'School'
            );

            // Get all phone numbers for the student (student + parents)
            const phoneNumbers = SMSService.getStudentPhoneNumbers(studentDetails);
            
            // Send SMS to all available phone numbers
            for (const phone of phoneNumbers) {
              await SMSService.sendSMS(phone, alertMessage);
            }
          }
        }
      }
    } catch (smsError) {
      console.error('Failed to send attendance alert SMS:', smsError);
      // Don't fail the attendance creation if SMS fails
    }

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
    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();
    if (!schoolFilter.schoolId) {
      return { success: false, error: true };
    }

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
            studentId: student.id,
            classId: data.classId,
            schoolId: schoolFilter.schoolId!,
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
    // FIRST: Validate school context before doing anything else
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Use the user's school ID
    const schoolId = userContext.schoolId;

    if (!schoolId) {
      return { success: false, error: true, message: "School ID is required" };
    }

    // Build the data object conditionally based on whether it's an exam or assignment
    const resultData: any = {
      score: data.score,
      feedback: data.feedback || null,
      school: {
        connect: { id: schoolId },
      },
      student: {
        connect: { id: data.studentId },
      },
    };

    // Connect to either exam or assignment, but not both
    if (data.examId) {
      // Check if student is eligible for this exam
      const eligibility = await prisma.examEligibleStudent.findUnique({
        where: {
          examId_studentId: {
            examId: data.examId,
            studentId: data.studentId,
          },
        },
      });

      if (!eligibility) {
        return { 
          success: false, 
          error: true, 
          message: "Student is not eligible for this exam. They may have joined the class after the exam was created." 
        };
      }

      resultData.exam = {
        connect: { id: data.examId },
      };
    } else if (data.assignmentId) {
      resultData.assignment = {
        connect: { id: data.assignmentId },
      };
    }

    await prisma.result.create({
      data: resultData,
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
    // Build the data object conditionally based on whether it's an exam or assignment
    const updateData: any = {
      score: data.score,
      feedback: data.feedback || null,
      student: {
        connect: { id: data.studentId },
      },
    };

    // Connect to either exam or assignment, but not both
    if (data.examId) {
      updateData.exam = {
        connect: { id: data.examId },
      };
      // Disconnect assignment if switching from assignment to exam
      updateData.assignment = {
        disconnect: true,
      };
    } else if (data.assignmentId) {
      updateData.assignment = {
        connect: { id: data.assignmentId },
      };
      // Disconnect exam if switching from exam to assignment
      updateData.exam = {
        disconnect: true,
      };
    }

    await prisma.result.update({
      where: {
        id: data.id,
      },
      data: updateData,
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
    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();
    if (!schoolFilter.schoolId) {
      return { success: false, error: true };
    }

    let classIdsToCreate: (number | null)[] = [];

    if (data.allClasses) {
      // If "All Classes" is selected, get all class IDs for this school
      const allClasses = await prisma.class.findMany({
        where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
        select: { id: true },
      });
      classIdsToCreate = allClasses.map(cls => cls.id);

      // Also create one event with no class (school-wide)
      classIdsToCreate.push(null);
    } else if (data.classIds && data.classIds.length > 0) {
      // If specific classes are selected
      classIdsToCreate = data.classIds;
    } else {
      // If no classes selected, create a school-wide event
      classIdsToCreate = [null];
    }

    // Create multiple event records using transaction
    const createdEvents = await prisma.$transaction(
      classIdsToCreate.map(classId =>
        prisma.event.create({
          data: {
            title: data.title,
            description: data.description,
            startTime: data.startTime,
            endTime: data.endTime,
            classId: classId,
            schoolId: schoolFilter.schoolId!,
          },
          include: {
            school: true,
            class: {
              include: {
                students: {
                  select: {
                    phone: true,
                    parentStudents: {
                      select: {
                        parent: {
                          select: {
                            phone: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        })
      )
    );

    // Send SMS notifications for events
    if (data.sendSMS && createdEvents.length > 0) {
      try {
        const { SMSService } = await import('@/lib/sms-service');
        const eventDate = data.startTime.toLocaleDateString();
        const eventMessage = SMSService.getEventNotificationMessage(
          data.title,
          eventDate,
          createdEvents[0].school.name
        );

        const phoneNumbers = new Set<string>();

        for (const event of createdEvents) {
          if (event.class) {
            // Send to specific class students and their parents
            for (const student of event.class.students) {
              const studentPhones = SMSService.getStudentPhoneNumbers(student);
              studentPhones.forEach(phone => phoneNumbers.add(phone));
            }
          } else {
            // Send to all students and parents in the school (school-wide event)
            const allStudents = await prisma.student.findMany({
              where: { schoolId: schoolFilter.schoolId },
              select: {
                phone: true,
                parentStudents: {
                  select: {
                    parent: {
                      select: {
                        phone: true
                      }
                    }
                  }
                }
              }
            });

            for (const student of allStudents) {
              const studentPhones = SMSService.getStudentPhoneNumbers(student);
              studentPhones.forEach(phone => phoneNumbers.add(phone));
            }
          }
        }

        // Send SMS to all collected phone numbers
        for (const phone of phoneNumbers) {
          await SMSService.sendSMS(phone, eventMessage);
        }
      } catch (smsError) {
        console.error('Failed to send event SMS:', smsError);
        // Don't fail the event creation if SMS fails
      }
    }

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
    // For now, just update the single event record
    // Note: Updating multi-class events would require more complex logic
    await prisma.event.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
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
    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();
    if (!schoolFilter.schoolId) {
      return { success: false, error: true };
    }

    // Ensure description is present in the payload
    const description = formData.description;

    const result = await prisma.announcement.create({
      data: {
        title: formData.title,
        description: description, // Add the required description field
        date: new Date(formData.date),
        priority: formData.priority as Priority,
        teacherId: formData.teacherId,
        classId: formData.classId ? parseInt(formData.classId) : null,
        schoolId: schoolFilter.schoolId,
      },
      include: {
        school: true,
        class: {
          include: {
            students: {
              select: {
                phone: true,
                parentStudents: {
                  select: {
                    parent: {
                      select: {
                        phone: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Send SMS notifications for announcements
    if (formData.sendSMS) {
      try {
        const { SMSService } = await import('@/lib/sms-service');
        const announcementMessage = SMSService.getAnnouncementMessage(
          formData.title,
          description,
          result.school.name
        );

        const phoneNumbers = new Set<string>();

        if (result.class) {
          // Send to specific class students and their parents
          for (const student of result.class.students) {
            const studentPhones = SMSService.getStudentPhoneNumbers(student);
            studentPhones.forEach(phone => phoneNumbers.add(phone));
          }
        } else {
          // Send to all students and parents in the school
          const allStudents = await prisma.student.findMany({
            where: { schoolId: schoolFilter.schoolId },
            select: {
              phone: true,
              parentStudents: {
                select: {
                  parent: {
                    select: {
                      phone: true
                    }
                  }
                }
              }
            }
          });

          for (const student of allStudents) {
            const studentPhones = SMSService.getStudentPhoneNumbers(student);
            studentPhones.forEach(phone => phoneNumbers.add(phone));
          }
        }

        // Send SMS to all collected phone numbers
        for (const phone of phoneNumbers) {
          await SMSService.sendSMS(phone, announcementMessage);
        }
      } catch (smsError) {
        console.error('Failed to send announcement SMS:', smsError);
        // Don't fail the announcement creation if SMS fails
      }
    }

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
    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    const classes = await prisma.class.findMany({
      where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}, // Add school filtering
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
    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    const students = await prisma.student.findMany({
      where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}, // Add school filtering
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

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    const query = {
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}), // Add school filtering
        ...(role === "teacher" && userId
          ? {
            subject: {
              teachers: {
                some: {
                  id: userId,
                },
              },
            },
          }
          : {}),
      },
      select: {
        id: true,
        title: true,
        classId: true,
        maxPoints: true,
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
      maxPoints: exam.maxPoints,
    }));
  } catch (error) {
    console.error("Error fetching exams:", error);
    return [];
  }
}

export async function fetchAssignments() {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    const query = {
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}), // Add school filtering
        ...(role === "teacher" && userId
          ? {
            teacherId: userId,
          }
          : {}),
      },
      select: {
        id: true,
        title: true,
        classId: true,
        maxPoints: true,
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

    const assignments = await prisma.assignment.findMany(query);

    return assignments.map((assignment) => ({
      id: assignment.id,
      title: `${assignment.title} (${assignment.subject?.name || "No Subject"})`,
      classId: assignment.classId,
      maxPoints: assignment.maxPoints,
    }));
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return [];
  }
}

/**
 * Fetches all teachers from the database
 */
export async function getTeachers() {
  try {
    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    const teachers = await prisma.teacher.findMany({
      where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}, // Add school filtering
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
        ...(data.password && { password: data.password }), // Update password if provided
      },
    });

    // Handle parent-student relationships with relationship types
    if (data.parentStudents !== undefined) {
      // First, delete existing relationships for this parent
      await prisma.parentStudent.deleteMany({
        where: { parentId: data.id },
      });

      // Then create new relationships if provided
      if (data.parentStudents.length > 0) {
        const validAssignments = data.parentStudents.filter(
          (assignment) => assignment.studentId && assignment.relationshipType
        );
        
        if (validAssignments.length > 0) {
          await prisma.parentStudent.createMany({
            data: validAssignments.map((assignment) => ({
              parentId: data.id!,
              studentId: assignment.studentId,
              relationshipType: assignment.relationshipType as any,
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    // Handle backward compatibility with studentIds
    if (data.studentIds !== undefined && data.parentStudents === undefined) {
      // Delete existing relationships
      await prisma.parentStudent.deleteMany({
        where: { parentId: data.id },
      });

      // Create new relationships with default GUARDIAN type
      if (data.studentIds.length > 0) {
        await prisma.parentStudent.createMany({
          data: data.studentIds.map(studentId => ({
            parentId: data.id!,
            studentId: studentId,
            relationshipType: 'GUARDIAN' as any,
          })),
          skipDuplicates: true,
        });
      }
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

// STAFF SALARY ACTIONS

export const createStaffSalary = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    const schoolId = userContext.schoolId;

    await prisma.staffSalary.create({
      data: {
        teacherId: data.teacherId,
        baseSalary: parseFloat(data.baseSalary),
        currency: data.currency,
        payFrequency: data.payFrequency,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive !== false,
        schoolId,
      },
    });

    revalidatePath("/list/payroll");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStaffSalary = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    await prisma.staffSalary.update({
      where: {
        id: data.id,
        schoolId: userContext.schoolId,
      },
      data: {
        baseSalary: parseFloat(data.baseSalary),
        currency: data.currency,
        payFrequency: data.payFrequency,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive !== false,
      },
    });

    revalidatePath("/list/payroll");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStaffSalary = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    const salaryId = parseInt(id);

    // Check if there are related records
    const relatedPayments = await prisma.salaryPayment.count({
      where: { salaryId: salaryId }
    });

    const relatedBonuses = await prisma.staffBonus.count({
      where: { salaryId: salaryId }
    });

    if (relatedPayments > 0 || relatedBonuses > 0) {
      return { 
        success: false, 
        error: true, 
        message: `Cannot delete salary record. It has ${relatedPayments} payment(s) and ${relatedBonuses} bonus(es) associated with it. Please delete those first.` 
      };
    }

    await prisma.staffSalary.delete({
      where: {
        id: salaryId,
        schoolId: userContext.schoolId,
      },
    });

    revalidatePath("/list/payroll");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, message: "Failed to delete salary record" };
  }
};

// SALARY PAYMENT ACTIONS

export const createSalaryPayment = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    const schoolId = userContext.schoolId;

    await prisma.salaryPayment.create({
      data: {
        salaryId: parseInt(data.salaryId),
        amount: parseFloat(data.amount),
        payPeriodStart: new Date(data.payPeriodStart),
        payPeriodEnd: new Date(data.payPeriodEnd),
        dueDate: new Date(data.dueDate),
        payDate: data.payDate ? new Date(data.payDate) : null,
        status: data.status,
        notes: data.notes || null,
        schoolId,
      },
    });

    revalidatePath("/list/payroll");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSalaryPayment = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    await prisma.salaryPayment.update({
      where: {
        id: data.id,
        schoolId: userContext.schoolId,
      },
      data: {
        amount: parseFloat(data.amount),
        payPeriodStart: new Date(data.payPeriodStart),
        payPeriodEnd: new Date(data.payPeriodEnd),
        dueDate: new Date(data.dueDate),
        payDate: data.payDate ? new Date(data.payDate) : null,
        status: data.status,
        notes: data.notes || null,
      },
    });

    revalidatePath("/list/payroll");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSalaryPayment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    await prisma.salaryPayment.delete({
      where: {
        id: parseInt(id),
        schoolId: userContext.schoolId,
      },
    });

    revalidatePath("/list/payroll");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// STAFF BONUS ACTIONS

export const createStaffBonus = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    const schoolId = userContext.schoolId;

    await prisma.staffBonus.create({
      data: {
        salaryId: parseInt(data.salaryId),
        amount: parseFloat(data.amount),
        reason: data.reason,
        bonusType: data.bonusType,
        dueDate: new Date(data.dueDate),
        payDate: data.payDate ? new Date(data.payDate) : null,
        status: data.status,
        notes: data.notes || null,
        schoolId,
      },
    });

    revalidatePath("/list/payroll");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStaffBonus = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    await prisma.staffBonus.update({
      where: {
        id: data.id,
        schoolId: userContext.schoolId,
      },
      data: {
        amount: parseFloat(data.amount),
        reason: data.reason,
        bonusType: data.bonusType,
        dueDate: new Date(data.dueDate),
        payDate: data.payDate ? new Date(data.payDate) : null,
        status: data.status,
        notes: data.notes || null,
      },
    });

    revalidatePath("/list/payroll");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStaffBonus = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    await prisma.staffBonus.delete({
      where: {
        id: parseInt(id),
        schoolId: userContext.schoolId,
      },
    });

    revalidatePath("/list/payroll");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// MARK SALARY PAYMENT AS PAID

export const markSalaryPaymentAsPaid = async (
  currentState: CurrentState,
  paymentId: number
) => {
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    await prisma.salaryPayment.update({
      where: {
        id: paymentId,
        schoolId: userContext.schoolId,
      },
      data: {
        status: "PAID",
        payDate: new Date(),
      },
    });

    revalidatePath("/list/payroll");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, message: "Failed to mark payment as paid" };
  }
};

// ACCOUNTING ACTIONS

// ACCOUNT ACTIONS
export const createAccount = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    const schoolId = userContext.schoolId;

    await prisma.account.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        subType: data.subType,
        description: data.description || null,
        isActive: data.isActive !== false,
        schoolId,
      },
    });

    revalidatePath("/accounting/accounts");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAccount = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    await prisma.account.update({
      where: {
        id: data.id,
        schoolId: userContext.schoolId,
      },
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        subType: data.subType,
        description: data.description || null,
        isActive: data.isActive !== false,
      },
    });

    revalidatePath("/accounting/accounts");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAccount = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    // Check if account has transactions
    const transactionCount = await prisma.transaction.count({
      where: { accountId: parseInt(id) }
    });

    if (transactionCount > 0) {
      return { 
        success: false, 
        error: true, 
        message: `Cannot delete account. It has ${transactionCount} transaction(s) associated with it.` 
      };
    }

    await prisma.account.delete({
      where: {
        id: parseInt(id),
        schoolId: userContext.schoolId,
      },
    });

    revalidatePath("/accounting/accounts");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// TRANSACTION ACTIONS
export const createTransaction = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    const schoolId = userContext.schoolId;

    await prisma.transaction.create({
      data: {
        reference: data.reference,
        description: data.description,
        amount: parseFloat(data.amount),
        type: data.type,
        paymentMethod: data.paymentMethod,
        accountId: parseInt(data.accountId),
        date: new Date(data.date),
        receiptNumber: data.receiptNumber || null,
        notes: data.notes || null,
        schoolId,
      },
    });

    revalidatePath("/accounting/transactions");
    revalidatePath("/accounting");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTransaction = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    await prisma.transaction.update({
      where: {
        id: data.id,
        schoolId: userContext.schoolId,
      },
      data: {
        reference: data.reference,
        description: data.description,
        amount: parseFloat(data.amount),
        type: data.type,
        paymentMethod: data.paymentMethod,
        accountId: parseInt(data.accountId),
        date: new Date(data.date),
        receiptNumber: data.receiptNumber || null,
        notes: data.notes || null,
      },
    });

    revalidatePath("/accounting/transactions");
    revalidatePath("/accounting");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTransaction = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return { success: false, error: true, message: "School context not found" };
    }

    await prisma.transaction.delete({
      where: {
        id: parseInt(id),
        schoolId: userContext.schoolId,
      },
    });

    revalidatePath("/accounting/transactions");
    revalidatePath("/accounting");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};