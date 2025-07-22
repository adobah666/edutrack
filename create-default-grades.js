// Script to create default grades that all schools can use
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating default grades...');

    // Define standard grades
    const defaultGrades = [
      { level: 1, name: 'Grade 1' },
      { level: 2, name: 'Grade 2' },
      { level: 3, name: 'Grade 3' },
      { level: 4, name: 'Grade 4' },
      { level: 5, name: 'Grade 5' },
      { level: 6, name: 'Grade 6' },
      { level: 7, name: 'Grade 7' },
      { level: 8, name: 'Grade 8' },
      { level: 9, name: 'Grade 9' },
      { level: 10, name: 'Grade 10' },
      { level: 11, name: 'Grade 11' },
      { level: 12, name: 'Grade 12' },
      { level: 13, name: 'Kindergarten' },
      { level: 14, name: 'Pre-K' },
    ];

    // Create grades using upsert to avoid duplicates
    for (const grade of defaultGrades) {
      const result = await prisma.grade.upsert({
        where: { level: grade.level },
        update: { name: grade.name },
        create: grade,
      });
      console.log(`✓ ${result.name} (Level ${result.level})`);
    }

    console.log('\n✅ Default grades created successfully!');
    console.log('All schools can now use these standard grades.');

  } catch (error) {
    console.error('❌ Error creating default grades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();