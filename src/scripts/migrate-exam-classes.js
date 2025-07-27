const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateExamClasses() {
  try {
    console.log('Starting migration of existing exams to use ExamClass relationship...');

    // Get all exams that have a classId but no examClasses records
    const examsToMigrate = await prisma.exam.findMany({
      where: {
        classId: {
          not: null,
        },
        examClasses: {
          none: {},
        },
      },
      include: {
        class: true,
      },
    });

    console.log(`Found ${examsToMigrate.length} exams to migrate`);

    for (const exam of examsToMigrate) {
      if (!exam.classId) continue;

      // Create ExamClass record for the existing class relationship
      await prisma.examClass.create({
        data: {
          examId: exam.id,
          classId: exam.classId,
        },
      });

      console.log(`✅ Migrated exam "${exam.title}" - linked to class ${exam.class?.name}`);
    }

    console.log('Migration completed successfully!');
    console.log(`Total exams migrated: ${examsToMigrate.length}`);
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateExamClasses();