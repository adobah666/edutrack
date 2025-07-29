const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateUserPasswords() {
  try {
    console.log('Starting password migration...');

    // Generate a simple default password
    const generateDefaultPassword = (name, surname) => {
      return `${name.toLowerCase()}${surname.toLowerCase()}123`;
    };

    // Update students without passwords
    const studentsWithoutPasswords = await prisma.student.findMany({
      where: {
        password: null
      },
      select: {
        id: true,
        name: true,
        surname: true,
        username: true
      }
    });

    console.log(`Found ${studentsWithoutPasswords.length} students without passwords`);

    for (const student of studentsWithoutPasswords) {
      const defaultPassword = generateDefaultPassword(student.name, student.surname);
      
      await prisma.student.update({
        where: { id: student.id },
        data: { password: defaultPassword }
      });
      
      console.log(`Updated password for student: ${student.username}`);
    }

    // Update parents without passwords
    const parentsWithoutPasswords = await prisma.parent.findMany({
      where: {
        password: null
      },
      select: {
        id: true,
        name: true,
        surname: true,
        username: true
      }
    });

    console.log(`Found ${parentsWithoutPasswords.length} parents without passwords`);

    for (const parent of parentsWithoutPasswords) {
      const defaultPassword = generateDefaultPassword(parent.name, parent.surname);
      
      await prisma.parent.update({
        where: { id: parent.id },
        data: { password: defaultPassword }
      });
      
      console.log(`Updated password for parent: ${parent.username}`);
    }

    console.log('Password migration completed successfully!');
    
  } catch (error) {
    console.error('Error during password migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateUserPasswords();