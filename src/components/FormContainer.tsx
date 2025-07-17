import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement"
    | "feeType"
    | "classFee"
    | "studentFee";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  if (type !== "delete") {
    switch (table) {
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: subjectTeachers };
        break;
      case "lesson":
        // Fetch subjects, classes and teachers for dropdowns 
        const [lessonSubjects, lessonClasses, lessonTeachers] = await Promise.all([
          prisma.subject.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          }),
          prisma.class.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          }),
          prisma.teacher.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, surname: true },
          }),
        ]);

        relatedData = {
          subjects: lessonSubjects,
          classes: lessonClasses,
          teachers: lessonTeachers,
        };
        break;
      case "event":
        const eventClasses = await prisma.class.findMany({
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        });
        relatedData = { classes: eventClasses };
        break;
      case "class":
        const classGrades = await prisma.grade.findMany({
          select: {
            id: true,
            name: true,
            level: true
          },
          orderBy: [
            { level: 'asc' }
          ]
        }).catch(e => {
          console.error('Error fetching grades:', e);
          return [];
        });
        console.log('Fetched grades:', classGrades); // Debug log
        
        const classTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
          orderBy: [
            { name: 'asc' },
            { surname: 'asc' }
          ]
        });
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;
      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        relatedData = { subjects: teacherSubjects };
        break;
      case "student":
        const studentGrades = await prisma.grade.findMany({
          select: { id: true, level: true, name: true },
          orderBy: [{ level: 'asc' }]
        });
        const studentClasses = await prisma.class.findMany({
          include: { _count: { select: { students: true } } },
        });
        relatedData = { classes: studentClasses, grades: studentGrades };
        break;
      case "exam":
        // Fetch subjects with teacher filter if role is teacher
        const examSubjects = await prisma.subject.findMany({
          where: role === "teacher" ? {
            teachers: {
              some: {
                id: currentUserId!
              }
            }
          } : undefined,
          select: { id: true, name: true },
        });
        
        // Fetch classes for the teacher or all classes for admin
        const examClasses = await prisma.class.findMany({
          where: role === "teacher" ? {
            supervisorId: currentUserId!
          } : undefined,
          select: { id: true, name: true },
        });
        
        relatedData = { 
          subjects: examSubjects, 
          classes: examClasses,
        };
        break;

      case "classFee":
        // Fetch classes and fee types for dropdowns
        const [classFeeClasses, feeTypes] = await Promise.all([
          prisma.class.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          }),
          prisma.feeType.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          }),
        ]);

        relatedData = {
          classes: classFeeClasses,
          feeTypes: feeTypes,
        };
        break;

      case "parent":
        // Fetch all grades for filtering
        const parentGrades = await prisma.grade.findMany({
          select: { id: true, level: true, name: true },
          orderBy: { level: 'asc' }
        });

        // Fetch all students without parents
        const availableStudents = await prisma.student.findMany({
          where: {
            OR: [
              { parentId: null },
              // Include current parent's students when updating
              ...(typeof id === 'string' ? [{ parentId: id }] : [])
            ]
          },
          select: { 
            id: true, 
            name: true, 
            surname: true,
            gradeId: true
          },
          orderBy: [
            { gradeId: 'asc' },
            { name: 'asc' }
          ]
        });

        relatedData = { 
          grades: parentGrades,
          students: availableStudents
        };
        break;

      case "attendance":
        const [attendanceClasses, allStudents] = await Promise.all([
          prisma.class.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true }
          }),
          prisma.student.findMany({
            orderBy: { name: "asc" },
            select: { 
              id: true, 
              name: true, 
              surname: true,
              classId: true 
            }
          })
        ]);
        relatedData = { 
          classes: attendanceClasses,
          students: allStudents 
        };
        break;

      default:
        break;
    }
  }

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;