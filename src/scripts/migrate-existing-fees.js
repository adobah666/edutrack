const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateExistingFees() {
  try {
    console.log('Starting migration of existing fees...');

    // Get all existing class fees that don't have eligible students assigned
    const existingFees = await prisma.classFee.findMany({
      where: {
        eligibleStudents: {
          none: {}
        }
      },
      include: {
        class: {
          include: {
            students: {
              select: {
                id: true,
                name: true,
                surname: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${existingFees.length} existing fees to migrate`);

    for (const fee of existingFees) {
      const studentsInClass = fee.class.students;
      
      if (studentsInClass.length > 0) {
        // Create eligibility records for all current students in the class
        await prisma.studentFeeEligibility.createMany({
          data: studentsInClass.map(student => ({
            studentId: student.id,
            classFeeId: fee.id
          })),
          skipDuplicates: true // In case some records already exist
        });

        console.log(`✅ Migrated fee ${fee.id} for ${studentsInClass.length} students in class ${fee.class.name}`);
      } else {
        console.log(`⚠️  Fee ${fee.id} has no students in class ${fee.class.name}`);
      }
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateExistingFees();