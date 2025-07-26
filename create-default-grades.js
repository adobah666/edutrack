const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDefaultGrades() {
  try {
    console.log('🎓 Creating default grades...');

    const grades = [
      { level: 1 },
      { level: 2 },
      { level: 3 },
      { level: 4 },
      { level: 5 },
      { level: 6 },
      { level: 7 },
      { level: 8 },
      { level: 9 },
      { level: 10 },
      { level: 11 },
      { level: 12 },
    ];

    for (const grade of grades) {
      await prisma.grade.upsert({
        where: { level: grade.level },
        update: {},
        create: grade,
      });
    }

    console.log('✅ Default grades created successfully:');
    console.log('   • Grade 1 through Grade 12');
    console.log('\n🎉 You can now create classes with proper grade assignments!');

  } catch (error) {
    console.error('❌ Error creating default grades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultGrades();