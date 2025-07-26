const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mock the auth and school filter functions for testing
const mockAuth = () => ({
  userId: 'user_test',
  sessionClaims: {
    metadata: { role: 'admin' }
  }
});

const mockGetSchoolFilter = async () => ({
  schoolId: 'cm2bqvqhj0000ue8gkl6wgqhd' // Use the actual school ID from your data
});

async function testFetchFunctions() {
  try {
    console.log('=== TESTING FETCH FUNCTIONS ===\n');
    
    // Test fetchStudents logic
    console.log('Testing fetchStudents logic:');
    const schoolFilter = await mockGetSchoolFilter();
    
    const students = await prisma.student.findMany({
      where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
      select: {
        id: true,
        name: true,
        surname: true,
        classId: true,
      },
      orderBy: [
        { name: "asc" },
        { surname: "asc" },
      ],
    });
    
    console.log(`Found ${students.length} students:`);
    students.forEach(student => {
      console.log(`  - ${student.name} ${student.surname} (ClassId: ${student.classId})`);
    });
    
    // Test fetchExams logic
    console.log('\nTesting fetchExams logic:');
    const exams = await prisma.exam.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
      select: {
        id: true,
        title: true,
        classId: true,
        maxPoints: true,
        subject: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });
    
    console.log(`Found ${exams.length} exams:`);
    exams.forEach(exam => {
      console.log(`  - ${exam.title} (ClassId: ${exam.classId}, Subject: ${exam.subject?.name})`);
    });
    
    // Test fetchAssignments logic
    console.log('\nTesting fetchAssignments logic:');
    const assignments = await prisma.assignment.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
      select: {
        id: true,
        title: true,
        classId: true,
        maxPoints: true,
        subject: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });
    
    console.log(`Found ${assignments.length} assignments:`);
    assignments.forEach(assignment => {
      console.log(`  - ${assignment.title} (ClassId: ${assignment.classId}, Subject: ${assignment.subject?.name})`);
    });
    
    // Test the filtering logic that happens in ResultForm
    console.log('\n=== TESTING RESULT FORM FILTERING LOGIC ===');
    
    // Simulate selecting the exam
    const selectedExam = exams[0];
    if (selectedExam) {
      console.log(`\nSelected exam: ${selectedExam.title} (ClassId: ${selectedExam.classId})`);
      
      // Filter students for this exam's class
      const examClassStudents = students.filter(student => 
        student.classId === selectedExam.classId
      );
      console.log(`Students in exam's class: ${examClassStudents.length}`);
      examClassStudents.forEach(student => {
        console.log(`  - ${student.name} ${student.surname}`);
      });
      
      // Check existing results for this exam
      const existingResults = await prisma.result.findMany({
        where: { examId: selectedExam.id },
        select: { studentId: true }
      });
      
      const studentsWithResults = new Set(existingResults.map(result => result.studentId));
      console.log(`Students with existing results: ${studentsWithResults.size}`);
      
      // Filter out students who already have results
      const availableStudents = examClassStudents.filter(student => 
        !studentsWithResults.has(student.id)
      );
      console.log(`Available students for grading: ${availableStudents.length}`);
      availableStudents.forEach(student => {
        console.log(`  - ${student.name} ${student.surname}`);
      });
    }
    
    // Simulate selecting the assignment
    const selectedAssignment = assignments[0];
    if (selectedAssignment) {
      console.log(`\nSelected assignment: ${selectedAssignment.title} (ClassId: ${selectedAssignment.classId})`);
      
      // Filter students for this assignment's class
      const assignmentClassStudents = students.filter(student => 
        student.classId === selectedAssignment.classId
      );
      console.log(`Students in assignment's class: ${assignmentClassStudents.length}`);
      assignmentClassStudents.forEach(student => {
        console.log(`  - ${student.name} ${student.surname}`);
      });
      
      // Check existing results for this assignment
      const existingResults = await prisma.result.findMany({
        where: { assignmentId: selectedAssignment.id },
        select: { studentId: true }
      });
      
      const studentsWithResults = new Set(existingResults.map(result => result.studentId));
      console.log(`Students with existing results: ${studentsWithResults.size}`);
      
      // Filter out students who already have results
      const availableStudents = assignmentClassStudents.filter(student => 
        !studentsWithResults.has(student.id)
      );
      console.log(`Available students for grading: ${availableStudents.length}`);
      availableStudents.forEach(student => {
        console.log(`  - ${student.name} ${student.surname}`);
      });
    }
    
  } catch (error) {
    console.error('Error testing fetch functions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFetchFunctions();