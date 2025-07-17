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

  console.log('Starting to seed grades...');
  // Clear existing grades first
  await prisma.grade.deleteMany({});
  
  for (const grade of grades) {
    await prisma.grade.create({
      data: grade
    });
  }
  console.log('Grades seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
