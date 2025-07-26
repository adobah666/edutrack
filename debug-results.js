const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugResults() {
  try {
    console.log('=== DEBUGGING RESULTS FORM DATA ===\n');
    
    // Check students with their class info
    const students = await prisma.student.findMany({
      include: {
        class: true,
        school: true
      }
    });
    console.log(`Students: ${students.length} records`);
    students.forEach(student => {
      console.log(`  - ${student.name} ${student.surname} (Class: ${student.class?.name || 'No class'}, ClassId: ${student.classId})`);
    });
    
    // Check exams with their class info
    const exams = await prisma.exam.findMany({
      include: {
        class: true,
        subject: true,
        school: true
      }
    });
    console.log(`\nExams: ${exams.length} records`);
    exams.forEach(exam => {
      console.log(`  - ${exam.title} (Class: ${exam.class?.name || 'No class'}, ClassId: ${exam.classId}, Subject: ${exam.subject?.name || 'No subject'})`);
    });
    
    // Check assignments with their class info
    const assignments = await prisma.assignment.findMany({
      include: {
        class: true,
        subject: true,
        school: true
      }
    });
    console.log(`\nAssignments: ${assignments.length} records`);
    assignments.forEach(assignment => {
      console.log(`  - ${assignment.title} (Class: ${assignment.class?.name || 'No class'}, ClassId: ${assignment.classId}, Subject: ${assignment.subject?.name || 'No subject'})`);
    });
    
    // Check existing results
    const results = await prisma.result.findMany({
      include: {
        student: true,
        exam: true,
        assignment: true
      }
    });
    console.log(`\nExisting Results: ${results.length} records`);
    results.forEach(result => {
      const assessment = result.exam ? `Exam: ${result.exam.title}` : `Assignment: ${result.assignment?.title}`;
      console.log(`  - ${result.student.name} ${result.student.surname} - ${assessment} - Score: ${result.score}`);
    });
    
  } catch (error) {
    console.error('Error debugging results:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugResults();