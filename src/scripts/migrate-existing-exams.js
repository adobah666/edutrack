const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateExistingExams() {
  try {
    console.log('Starting migration of existing exams...');

    // Get all exams that don't have eligibility records
    const examsWithoutEligibility = await prisma.exam.findMany({
      where: {
        eligibleStudents: {
          none: {},
        },
      },
      include: {
        class: true,
      },
    });

    console.log(`Found ${examsWithoutEligibility.length} exams without eligibility records`);

    for (const exam of examsWithoutEligibility) {
      if (!exam.classId) {
        console.log(`Skipping exam "${exam.title}" - no class assigned`);
        continue;
      }

      // Get all students currently in the exam's class
      const studentsInClass = await prisma.student.findMany({
        where: {
          classId: exam.classId,
          schoolId: exam.schoolId,
        },
        select: {
          id: true,
          name: true,
          surname: true,
        },
      });

      if (studentsInClass.length === 0) {
        console.log(`No students found for exam "${exam.title}" in class ${exam.class?.name}`);
        continue;
      }

      // Create eligibility records for all students in the class
      await prisma.examEligibleStudent.createMany({
        data: studentsInClass.map(student => ({
          examId: exam.id,
          studentId: student.id,
        })),
        skipDuplicates: true, // In case some records already exist
      });

      console.log(`✅ Added eligibility for ${studentsInClass.length} students to exam "${exam.title}"`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateExistingExams();