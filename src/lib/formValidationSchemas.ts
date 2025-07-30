import { z } from "zod";

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  teachers: z.array(z.string()), //teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Class name is required!" }),
  capacity: z.coerce.number().min(1, { message: "Capacity is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade is required!" }),
  supervisorId: z.string().min(1, { message: "Supervisor is required!" }),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  subjects: z.array(z.string()).optional(), // subject ids (kept for backward compatibility)
  teacherSubjectClasses: z.array(z.object({
    id: z.number().optional(),
    subjectId: z.number().min(1, { message: "Subject is required!" }),
    classId: z.number().min(1, { message: "Class is required!" }),
  })).optional(),
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  otherNames: z.string().optional(),
  surname: z.string().min(1, { message: "Last name is required!" }),
  address: z.string(),
  img: z.string().optional(),
  phone: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  parentId: z.string().optional(),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  term: z.enum(["FIRST", "SECOND", "THIRD", "FINAL"], { message: "Term is required!" }),
  subjectId: z.coerce.number({ message: "Subject is required!" }),
  classId: z.coerce.number().optional(), // Keep for backward compatibility
  classIds: z.array(z.coerce.number()).min(1, { message: "At least one class is required!" }).optional(),
  maxPoints: z.coerce.number().min(1, { message: "Max points must be at least 1!" }).default(100),
}).refine((data) => data.classId || (data.classIds && data.classIds.length > 0), {
  message: "At least one class must be selected!",
  path: ["classIds"],
});


export type ExamSchema = z.infer<typeof examSchema>;

export const parentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string(),
  address: z.string(),
  img: z.string().optional(),
  studentIds: z.array(z.string()), // Keep for backward compatibility
  parentStudents: z.array(z.object({
    id: z.number().optional(),
    studentId: z.string().min(1, { message: "Student is required!" }),
    relationshipType: z.enum(["FATHER", "MOTHER", "GUARDIAN", "UNCLE", "AUNT", "GRANDFATHER", "GRANDMOTHER", "STEPFATHER", "STEPMOTHER", "OTHER"], { message: "Relationship type is required!" }),
  })).optional(),
});

export type ParentSchema = z.infer<typeof parentSchema>;

export const lessonSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Lesson title is required!" }),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"], 
    { message: "Day is required!" }),
  startTime: z.string().min(1, { message: "Start time is required!" }),
  endTime: z.string().min(1, { message: "End time is required!" }),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
});

export type LessonSchema = z.infer<typeof lessonSchema>;


export const assignmentSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Assignment title is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  startDate: z.coerce.date({ message: "Start date is required!" }).default(() => new Date()),
  dueDate: z.coerce.date({ message: "Due date is required!" }),
  maxPoints: z.coerce.number().min(0, { message: "Max points must be a positive number!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
  term: z.enum(["FIRST", "SECOND", "THIRD", "FINAL"], { message: "Term is required!" }).default("FIRST"),
});

export type AssignmentSchema = z.infer<typeof assignmentSchema>;



export const attendanceSchema = z.object({
  id: z.coerce.number().optional(),
  date: z.coerce.date({ message: "Date is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  students: z.array(z.object({
    id: z.string(),
    isPresent: z.boolean()
  }))
});

export type AttendanceSchema = z.infer<typeof attendanceSchema>;

export const resultSchema = z.object({
  id: z.coerce.number().optional(),
  score: z.coerce.number().min(0, { message: "Score must be a positive number!" }),
  studentId: z.string().min(1, { message: "Student is required!" }),
  examId: z.coerce.number().optional(),
  assignmentId: z.coerce.number().optional(),
  feedback: z.string().optional(),
}).refine(
  (data) => data.examId || data.assignmentId,
  { message: "Either an exam or assignment must be selected" }
);

export type ResultSchema = z.infer<typeof resultSchema>;



// Event Schema
export const eventSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  startTime: z.coerce.date({ message: "Start time is required" }),
  endTime: z.coerce.date({ message: "End time is required" }),
  classIds: z.array(z.coerce.number()).optional(), // Changed to support multiple classes
  allClasses: z.boolean().optional(), // Option to select all classes
  sendSMS: z.boolean().optional(),
});

export type EventSchema = z.infer<typeof eventSchema>;


// Announcement Schema
export const announcementSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  priority: z.string().min(1, { message: "Priority is required" }),
  teacherId: z.string().min(1, { message: "Teacher is required" }),
  classId: z.string().optional(),
  sendSMS: z.boolean().optional(),
});

export type AnnouncementSchema = z.infer<typeof announcementSchema>;