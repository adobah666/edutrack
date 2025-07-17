import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Only seed grades
  const grades: { level: number; name: string }[] = [
    { level: 1, name: 'Creche' },
    { level: 2, name: 'Nursery 1' },
    { level: 3, name: 'Nursery 2' },
    { level: 4, name: 'KG 1' },
    { level: 5, name: 'KG 2' },
    { level: 6, name: 'Class 1' },
    { level: 7, name: 'Class 2' },
    { level: 8, name: 'Class 3' },
    { level: 9, name: 'Class 4' },
    { level: 10, name: 'Class 5' },
    { level: 11, name: 'Class 6' },
    { level: 12, name: 'JHS 1' },
    { level: 13, name: 'JHS 2' },
    { level: 14, name: 'JHS 3' }
  ];

  console.log('Start seeding grades...');
  
  for (const grade of grades) {
    const createdGrade = await prisma.grade.upsert({
      where: { level: grade.level },
      update: grade,
      create: grade,
    });
    console.log(`Created grade with ID: ${createdGrade.id}`);
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
