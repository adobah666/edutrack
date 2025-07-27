const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFormContainer() {
  try {
    console.log('🔍 Debugging FormContainer Issue...\n');

    // Find all teachers with assignments
    const teachersWithAssignments = await prisma.teacher.findMany({
      include: {
        teacherSubjectClasses: {
          include: {
            subject: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } }
          }
        }
      },
      where: {
        teacherSubjectClasses: {
          some: {}
        }
      }
    });

    console.log(`Found ${teachersWithAssignments.length} teachers with assignments:`);
    
    teachersWithAssignments.forEach((teacher, index) => {
      console.log(`\n${index + 1}. ${teacher.name} ${teacher.surname}`);
      console.log(`   ID: ${teacher.id}`);
      console.log(`   Username: ${teacher.username}`);
      console.log(`   Assignments: ${teacher.teacherSubjectClasses.length}`);
      teacher.teacherSubjectClasses.forEach(assignment => {
        console.log(`     - ${assignment.subject.name} → ${assignment.class.name}`);
      });
    });

    if (teachersWithAssignments.length > 0) {
      const testTeacher = teachersWithAssignments[0];
      console.log(`\n🧪 Testing FormContainer query for: ${testTeacher.name} ${testTeacher.surname}`);
      console.log(`Using ID: ${testTeacher.id}`);
      
      // Simulate the exact query that FormContainer does
      const formContainerResult = await prisma.teacher.findUnique({
        where: { id: testTeacher.id },
        include: {
          teacherSubjectClasses: {
            include: {
              subject: { select: { id: true, name: true } },
              class: { select: { id: true, name: true } }
            }
          }
        }
      });

      console.log('\n📋 FormContainer query result:');
      if (formContainerResult) {
        console.log(`✅ Teacher found: ${formContainerResult.name} ${formContainerResult.surname}`);
        console.log(`✅ Assignments found: ${formContainerResult.teacherSubjectClasses.length}`);
        console.log('Assignments data:', JSON.stringify(formContainerResult.teacherSubjectClasses, null, 2));
      } else {
        console.log('❌ Teacher not found with FormContainer query');
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFormContainer();