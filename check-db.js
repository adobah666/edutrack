const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== CHECKING DATABASE CONTENTS ===\n');
    
    // Check grades
    const grades = await prisma.grade.findMany();
    console.log(`Grades: ${grades.length} records`);
    grades.forEach(grade => console.log(`  - ${grade.level}: ${grade.name}`));
    
    // Check schools
    const schools = await prisma.school.findMany();
    console.log(`\nSchools: ${schools.length} records`);
    schools.forEach(school => console.log(`  - ${school.name}`));
    
    // Check classes
    const classes = await prisma.class.findMany();
    console.log(`\nClasses: ${classes.length} records`);
    classes.forEach(cls => console.log(`  - ${cls.name} (Grade: ${cls.gradeId})`));
    
    // Check students
    const students = await prisma.student.findMany();
    console.log(`\nStudents: ${students.length} records`);
    
    // Check teachers
    const teachers = await prisma.teacher.findMany();
    console.log(`\nTeachers: ${teachers.length} records`);
    
    // Check admins
    const admins = await prisma.admin.findMany();
    console.log(`\nAdmins: ${admins.length} records`);
    
    // Check parents
    const parents = await prisma.parent.findMany();
    console.log(`\nParents: ${parents.length} records`);
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();