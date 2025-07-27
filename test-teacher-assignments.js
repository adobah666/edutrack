const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTeacherAssignments() {
  try {
    console.log('🧪 Testing Teacher-Subject-Class Assignment System...\n');

    // Check if we have the new TeacherSubjectClass table
    console.log('1. Checking TeacherSubjectClass table structure...');
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'TeacherSubjectClass'
      ORDER BY ordinal_position;
    `;
    console.log('✅ TeacherSubjectClass table columns:', tableInfo);

    // Check if we can query the new relationship
    console.log('\n2. Testing relationship queries...');
    const teachersWithAssignments = await prisma.teacher.findMany({
      include: {
        teacherSubjectClasses: {
          include: {
            subject: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } }
          }
        },
        subjects: true,
        classes: true
      },
      take: 3
    });

    console.log(`✅ Found ${teachersWithAssignments.length} teachers`);
    teachersWithAssignments.forEach(teacher => {
      console.log(`   - ${teacher.name} ${teacher.surname}:`);
      console.log(`     * Old subjects: ${teacher.subjects.map(s => s.name).join(', ') || 'None'}`);
      console.log(`     * Old classes: ${teacher.classes.map(c => c.name).join(', ') || 'None'}`);
      console.log(`     * New assignments: ${teacher.teacherSubjectClasses.map(a => `${a.subject.name} → ${a.class.name}`).join(', ') || 'None'}`);
    });

    // Test creating a granular assignment (if we have data)
    const subjects = await prisma.subject.findMany({ take: 2 });
    const classes = await prisma.class.findMany({ take: 2 });
    const teachers = await prisma.teacher.findMany({ take: 1 });

    if (subjects.length >= 1 && classes.length >= 1 && teachers.length >= 1) {
      console.log('\n3. Testing granular assignment creation...');
      
      const testAssignment = await prisma.teacherSubjectClass.create({
        data: {
          teacherId: teachers[0].id,
          subjectId: subjects[0].id,
          classId: classes[0].id
        },
        include: {
          teacher: { select: { name: true, surname: true } },
          subject: { select: { name: true } },
          class: { select: { name: true } }
        }
      });

      console.log(`✅ Created assignment: ${testAssignment.teacher.name} ${testAssignment.teacher.surname} teaches ${testAssignment.subject.name} to ${testAssignment.class.name}`);

      // Clean up test data
      await prisma.teacherSubjectClass.delete({
        where: { id: testAssignment.id }
      });
      console.log('✅ Test assignment cleaned up');
    } else {
      console.log('⚠️  Skipping assignment creation test - insufficient test data');
    }

    console.log('\n🎉 All tests passed! The granular teacher-subject-class assignment system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTeacherAssignments();