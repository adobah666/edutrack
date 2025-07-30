const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestPhoneNumbers() {
  try {
    console.log('Adding test phone numbers to students and parents...');

    // Sample Ghana phone numbers for testing
    const testPhoneNumbers = [
      '233241234567',
      '233501234567',
      '233261234567',
      '233271234567',
      '233551234567',
      '233201234567',
      '233231234567',
      '233281234567',
      '233291234567',
      '233571234567'
    ];

    // Get all students without phone numbers
    const studentsWithoutPhones = await prisma.student.findMany({
      where: {
        OR: [
          { phone: null },
          { phone: '' }
        ]
      },
      take: 5 // Limit to first 5 students
    });

    console.log(`Found ${studentsWithoutPhones.length} students without phone numbers`);

    // Add phone numbers to some students
    for (let i = 0; i < studentsWithoutPhones.length && i < 3; i++) {
      const student = studentsWithoutPhones[i];
      const phoneNumber = testPhoneNumbers[i];
      
      await prisma.student.update({
        where: { id: student.id },
        data: { phone: phoneNumber }
      });
      
      console.log(`✅ Added phone ${phoneNumber} to student: ${student.name} ${student.surname}`);
    }

    // Get all parents without phone numbers
    const parentsWithoutPhones = await prisma.parent.findMany({
      where: {
        OR: [
          { phone: null },
          { phone: '' }
        ]
      },
      take: 5 // Limit to first 5 parents
    });

    console.log(`Found ${parentsWithoutPhones.length} parents without phone numbers`);

    // Add phone numbers to parents
    for (let i = 0; i < parentsWithoutPhones.length; i++) {
      const parent = parentsWithoutPhones[i];
      const phoneNumber = testPhoneNumbers[i + 3]; // Use different numbers
      
      await prisma.parent.update({
        where: { id: parent.id },
        data: { phone: phoneNumber }
      });
      
      console.log(`✅ Added phone ${phoneNumber} to parent: ${parent.name} ${parent.surname}`);
    }

    // Show summary of phone numbers added
    const studentsWithPhones = await prisma.student.count({
      where: {
        phone: {
          not: null,
          not: ''
        }
      }
    });

    const parentsWithPhones = await prisma.parent.count({
      where: {
        phone: {
          not: null,
          not: ''
        }
      }
    });

    console.log('\n📊 Summary:');
    console.log(`Students with phone numbers: ${studentsWithPhones}`);
    console.log(`Parents with phone numbers: ${parentsWithPhones}`);
    console.log('\n🎉 Test phone numbers added successfully!');
    console.log('\nYou can now test the SMS functionality with these phone numbers.');
    console.log('Note: These are test numbers. Replace with real numbers for actual SMS sending.');

  } catch (error) {
    console.error('Error adding test phone numbers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestPhoneNumbers();