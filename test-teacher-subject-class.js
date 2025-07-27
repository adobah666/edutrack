const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTeacherSubjectClassSystem() {
  try {
    console.log('🧪 Testing Teacher-Subject-Class Assignment System...\n');

    // 1. Check if we have test data
    console.log('1. Checking available test data...');
    
    const [teachers, subjects, classes] = await Promise.all([
      prisma.teacher.findMany({ take: 3, select: { id: true, name: true, surname: true } }),
      prisma.subject.findMany({ take: 3, select: { id: true, name: true } }),
      prisma.class.findMany({ take: 3, select: { id: true, name: true } })
    ]);

    console.log(`   - Teachers: ${teachers.length} found`);
    teachers.forEach(t => console.log(`     * ${t.name} ${t.surname} (ID: ${t.id})`));
    
    console.log(`   - Subjects: ${subjects.length} found`);
    subjects.forEach(s => console.log(`     * ${s.name} (ID: ${s.id})`));
    
    console.log(`   - Classes: ${classes.length} found`);
    classes.forEach(c => console.log(`     * ${c.name} (ID: ${c.id})`));

    if (teachers.length === 0 || subjects.length === 0 || classes.length === 0) {
      console.log('⚠️  Insufficient test data. Please create some teachers, subjects, and classes first.');
      return;
    }

    // 2. Test creating a teacher-subject-class assignment
    console.log('\n2. Testing assignment creation...');
    
    const testAssignment = {
      teacherId: teachers[0].id,
      subjectId: subjects[0].id,
      classId: classes[0].id
    };

    console.log(`   Creating assignment: ${teachers[0].name} ${teachers[0].surname} teaches ${subjects[0].name} to ${classes[0].name}`);

    const createdAssignment = await prisma.teacherSubjectClass.create({
      data: testAssignment,
      include: {
        teacher: { select: { name: true, surname: true } },
        subject: { select: { name: true } },
        class: { select: { name: true } }
      }
    });

    console.log('   ✅ Assignment created successfully!');
    console.log(`   Assignment ID: ${createdAssignment.id}`);

    // 3. Test querying teacher with assignments
    console.log('\n3. Testing teacher query with assignments...');
    
    const teacherWithAssignments = await prisma.teacher.findUnique({
      where: { id: teachers[0].id },
      include: {
        teacherSubjectClasses: {
          include: {
            subject: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (teacherWithAssignments) {
      console.log(`   Teacher: ${teacherWithAssignments.name} ${teacherWithAssignments.surname}`);
      console.log(`   Assignments: ${teacherWithAssignments.teacherSubjectClasses.length}`);
      teacherWithAssignments.teacherSubjectClasses.forEach(assignment => {
        console.log(`     - ${assignment.subject.name} → ${assignment.class.name}`);
      });
    }

    // 4. Test the display format (like in the UI)
    console.log('\n4. Testing UI display format...');
    
    const granularAssignments = teacherWithAssignments?.teacherSubjectClasses.map(assignment => 
      `${assignment.subject.name} → ${assignment.class.name}`
    ).join(', ');
    
    console.log(`   UI Display: "${granularAssignments}"`);

    // 5. Clean up test data
    console.log('\n5. Cleaning up test data...');
    await prisma.teacherSubjectClass.delete({
      where: { id: createdAssignment.id }
    });
    console.log('   ✅ Test assignment cleaned up');

    console.log('\n🎉 All tests passed! The Teacher-Subject-Class system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTeacherSubjectClassSystem();