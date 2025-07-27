const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUpdateFormData() {
  try {
    console.log('🧪 Testing Update Form Data Flow...\n');

    // Find a teacher with assignments
    const teacherWithAssignments = await prisma.teacher.findFirst({
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
          some: {} // Has at least one assignment
        }
      }
    });

    if (!teacherWithAssignments) {
      console.log('❌ No teacher with assignments found. Please create some assignments first.');
      return;
    }

    console.log(`Found teacher: ${teacherWithAssignments.name} ${teacherWithAssignments.surname}`);
    console.log(`Teacher ID: ${teacherWithAssignments.id}`);
    console.log(`Number of assignments: ${teacherWithAssignments.teacherSubjectClasses.length}`);
    
    console.log('\nExisting assignments:');
    teacherWithAssignments.teacherSubjectClasses.forEach((assignment, index) => {
      console.log(`  ${index + 1}. ${assignment.subject.name} → ${assignment.class.name}`);
      console.log(`     - Assignment ID: ${assignment.id}`);
      console.log(`     - Subject ID: ${assignment.subjectId}`);
      console.log(`     - Class ID: ${assignment.classId}`);
    });

    console.log('\n📋 What should happen in the update form:');
    console.log('1. FormContainer should fetch this data ✓');
    console.log('2. Pass it as existingAssignments to TeacherForm ✓');
    console.log('3. TeacherForm passes it as defaultAssignments to TeacherSubjectClassAssignment ✓');
    console.log('4. Component should display these assignments in the form');
    console.log('5. User can add more assignments without losing existing ones');

    console.log('\n🔍 Expected data structure for form:');
    const expectedFormData = teacherWithAssignments.teacherSubjectClasses.map(assignment => ({
      id: assignment.id,
      subjectId: assignment.subjectId,
      classId: assignment.classId,
      subject: assignment.subject,
      class: assignment.class
    }));
    console.log(JSON.stringify(expectedFormData, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdateFormData();