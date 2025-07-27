const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugTeacherForm() {
  try {
    console.log('🔍 Debugging Teacher Form Data...\n');

    // Find the specific teacher you mentioned
    const teacherId = 'bat_tacher69_3989'; // From your message
    
    console.log(`Looking for teacher with ID: ${teacherId}`);
    
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        teacherSubjectClasses: {
          include: {
            subject: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!teacher) {
      console.log('❌ Teacher not found with that ID');
      
      // Let's find any teacher with assignments
      const anyTeacher = await prisma.teacher.findFirst({
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
      
      if (anyTeacher) {
        console.log(`\nFound teacher: ${anyTeacher.name} ${anyTeacher.surname} (ID: ${anyTeacher.id})`);
        console.log('Assignments:', anyTeacher.teacherSubjectClasses);
      }
      return;
    }

    console.log(`✅ Found teacher: ${teacher.name} ${teacher.surname}`);
    console.log(`Number of assignments: ${teacher.teacherSubjectClasses.length}`);
    
    console.log('\n📋 Raw data from database:');
    console.log(JSON.stringify(teacher.teacherSubjectClasses, null, 2));
    
    console.log('\n🔧 What FormContainer should pass to form:');
    const formData = {
      subjects: [], // This would be fetched separately
      classes: [], // This would be fetched separately  
      existingAssignments: teacher.teacherSubjectClasses
    };
    console.log('existingAssignments:', JSON.stringify(formData.existingAssignments, null, 2));
    
    console.log('\n🎯 What TeacherSubjectClassAssignment should receive:');
    console.log('defaultAssignments prop should be:', JSON.stringify(teacher.teacherSubjectClasses, null, 2));
    
    console.log('\n🔄 How it should be transformed:');
    const transformed = teacher.teacherSubjectClasses.map((assignment) => ({
      id: assignment.id,
      subjectId: assignment.subjectId || assignment.subject?.id || 0,
      classId: assignment.classId || assignment.class?.id || 0,
    }));
    console.log('Transformed for component state:', JSON.stringify(transformed, null, 2));

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTeacherForm();