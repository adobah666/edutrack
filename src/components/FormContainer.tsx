import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";
import { getSchoolFilter } from "@/lib/school-context";

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
    | "studentFee"
    | "admin"
    | "school"
    | "staffSalary"
    | "salaryPayment"
    | "staffBonus"
    | "account"
    | "transaction";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  if (type !== "delete") {
    switch (table) {
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: subjectTeachers };
        break;
      case "lesson":
        // Fetch subjects, classes and teachers for dropdowns 
        const [lessonSubjects, lessonClasses, lessonTeachers] = await Promise.all([
          prisma.subject.findMany({
            where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          }),
          prisma.class.findMany({
            where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          }),
          prisma.teacher.findMany({
            where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
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
          where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        });
        relatedData = { classes: eventClasses };
        break;
      case "class":
        const classGrades = await prisma.grade.findMany({
          // Remove school filter for grades - they should be universal
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
          where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
          select: { id: true, name: true, surname: true },
          orderBy: [
            { name: 'asc' },
            { surname: 'asc' }
          ]
        });
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;
      case "teacher":
        console.log('FormContainer: Processing teacher case, id:', id, 'type:', type); // Debug log
        const [teacherSubjects, teacherClasses] = await Promise.all([
          prisma.subject.findMany({
            where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
            select: { id: true, name: true },
          }),
          prisma.class.findMany({
            where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
            select: { id: true, name: true },
          })
        ]);
        
        // If editing, fetch existing teacher-subject-class assignments
        let existingAssignments: any[] = [];
        if (id) {
          console.log('FormContainer: Fetching teacher with ID:', id); // Debug log
          try {
            const teacher = await prisma.teacher.findUnique({
              where: { id: id as string },
              include: {
                teacherSubjectClasses: {
                  include: {
                    subject: { select: { id: true, name: true } },
                    class: { select: { id: true, name: true } }
                  }
                }
              }
            });
            console.log('FormContainer: Found teacher:', teacher ? `${teacher.name} ${teacher.surname}` : 'null'); // Debug log
            existingAssignments = teacher?.teacherSubjectClasses || [];
            console.log('FormContainer: Fetched existing assignments for teacher:', existingAssignments); // Debug log
          } catch (error) {
            console.error('FormContainer: Error fetching teacher assignments:', error); // Debug log
          }
        } else {
          console.log('FormContainer: No ID provided, this is a create form'); // Debug log
        }
        
        relatedData = { 
          subjects: teacherSubjects, 
          classes: teacherClasses,
          existingAssignments 
        };
        console.log('RelatedData for teacher form:', relatedData); // Debug log
        break;
      case "student":
        const studentGrades = await prisma.grade.findMany({
          // Remove school filter for grades - they should be universal
          select: { id: true, level: true, name: true },
          orderBy: [{ level: 'asc' }]
        });
        const studentClasses = await prisma.class.findMany({
          where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
          include: { _count: { select: { students: true } } },
        });
        relatedData = { classes: studentClasses, grades: studentGrades };
        break;
      case "exam":
        // Fetch subjects with teacher filter if role is teacher
        const examSubjects = await prisma.subject.findMany({
          where: role === "teacher" ? {
            ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
            teachers: {
              some: {
                id: currentUserId!
              }
            }
          } : (schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
          select: { id: true, name: true },
        });
        
        // Fetch classes for the teacher or all classes for admin
        const examClasses = await prisma.class.findMany({
          where: role === "teacher" ? {
            ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
            supervisorId: currentUserId!
          } : (schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
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
            where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          }),
          prisma.feeType.findMany({
            where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
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
          // Remove school filter for grades - they should be universal
          select: { id: true, level: true, name: true },
          orderBy: { level: 'asc' }
        });

        // Fetch all students in the school
        const availableStudents = await prisma.student.findMany({
          where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
          include: {
            class: true
          },
          orderBy: [
            { gradeId: 'asc' },
            { name: 'asc' }
          ]
        });

        // Transform students to include className
        const studentsWithClass = availableStudents.map(student => ({
          ...student,
          className: student.class?.name
        }));

        // If editing, fetch existing parent-student relationships
        let existingParentAssignments: any[] = [];
        if (id) {
          console.log('FormContainer: Fetching parent with ID:', id); // Debug log
          try {
            const parent = await prisma.parent.findUnique({
              where: { id: id as string },
              include: {
                parentStudents: {
                  include: {
                    student: { 
                      select: { 
                        id: true, 
                        name: true, 
                        surname: true,
                        class: { select: { name: true } }
                      } 
                    }
                  }
                }
              }
            });
            console.log('FormContainer: Found parent:', parent ? `${parent.name} ${parent.surname}` : 'null'); // Debug log
            existingParentAssignments = parent?.parentStudents || [];
            console.log('FormContainer: Fetched existing parent assignments:', existingParentAssignments); // Debug log
          } catch (error) {
            console.error('FormContainer: Error fetching parent assignments:', error); // Debug log
          }
        } else {
          console.log('FormContainer: No ID provided, this is a create form'); // Debug log
        }

        relatedData = { 
          grades: parentGrades, 
          students: studentsWithClass,
          existingAssignments: existingParentAssignments
        };
        console.log('RelatedData for parent form:', relatedData); // Debug log
        break;

      case "attendance":
        const [attendanceClasses, allStudents] = await Promise.all([
          prisma.class.findMany({
            where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
            orderBy: { name: "asc" },
            select: { id: true, name: true }
          }),
          prisma.student.findMany({
            where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
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

      case "staffSalary":
        // Fetch teachers without salary records for create, or all teachers for update
        const availableTeachers = await prisma.teacher.findMany({
          where: {
            ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
            ...(type === "create" ? { salary: null } : {})
          },
          select: { id: true, name: true, surname: true },
          orderBy: [{ name: "asc" }, { surname: "asc" }]
        });
        relatedData = { teachers: availableTeachers };
        break;

      case "salaryPayment":
      case "staffBonus":
        // These forms get salaryId from data prop, no additional related data needed
        relatedData = {};
        break;

      case "account":
        // No additional related data needed for accounts
        relatedData = {};
        break;

      case "transaction":
        // Fetch accounts for transaction form
        const accounts = await prisma.account.findMany({
          where: {
            ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
            isActive: true,
          },
          select: { id: true, code: true, name: true, type: true },
          orderBy: { code: "asc" },
        });
        relatedData = { accounts };
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