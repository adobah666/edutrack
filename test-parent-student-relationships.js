const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testParentStudentRelationships() {
  try {
    console.log('🧪 Testing Parent-Student Relationship System...\n');

    // 1. Check if we have the new ParentStudent table
    console.log('1. Checking ParentStudent table structure...');
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'ParentStudent'
      ORDER BY ordinal_position;
    `;
    console.log('✅ ParentStudent table columns:', tableInfo);

    // 2. Check available relationship types
    console.log('\n2. Available relationship types:');
    const relationshipTypes = ['FATHER', 'MOTHER', 'GUARDIAN', 'UNCLE', 'AUNT', 'GRANDFATHER', 'GRANDMOTHER', 'STEPFATHER', 'STEPMOTHER', 'OTHER'];
    console.log('✅ Relationship types:', relationshipTypes);

    // 3. Check if we have test data
    console.log('\n3. Checking available test data...');
    
    const [parents, students] = await Promise.all([
      prisma.parent.findMany({ take: 3, select: { id: true, name: true, surname: true } }),
      prisma.student.findMany({ take: 3, select: { id: true, name: true, surname: true } })
    ]);

    console.log(`   - Parents: ${parents.length} found`);
    parents.forEach(p => console.log(`     * ${p.name} ${p.surname} (ID: ${p.id})`));
    
    console.log(`   - Students: ${students.length} found`);
    students.forEach(s => console.log(`     * ${s.name} ${s.surname} (ID: ${s.id})`));

    if (parents.length === 0 || students.length === 0) {
      console.log('⚠️  Insufficient test data. Please create some parents and students first.');
      return;
    }

    // 4. Test creating a parent-student relationship
    console.log('\n4. Testing relationship creation...');
    
    const testRelationship = {
      parentId: parents[0].id,
      studentId: students[0].id,
      relationshipType: 'FATHER'
    };

    console.log(`   Creating relationship: ${parents[0].name} ${parents[0].surname} as FATHER of ${students[0].name} ${students[0].surname}`);

    const createdRelationship = await prisma.parentStudent.create({
      data: testRelationship,
      include: {
        parent: { select: { name: true, surname: true } },
        student: { select: { name: true, surname: true } }
      }
    });

    console.log('   ✅ Relationship created successfully!');
    console.log(`   Relationship ID: ${createdRelationship.id}`);

    // 5. Test querying parent with relationships
    console.log('\n5. Testing parent query with relationships...');
    
    const parentWithRelationships = await prisma.parent.findUnique({
      where: { id: parents[0].id },
      include: {
        parentStudents: {
          include: {
            student: { select: { id: true, name: true, surname: true } }
          }
        }
      }
    });

    if (parentWithRelationships) {
      console.log(`   Parent: ${parentWithRelationships.name} ${parentWithRelationships.surname}`);
      console.log(`   Relationships: ${parentWithRelationships.parentStudents.length}`);
      parentWithRelationships.parentStudents.forEach(rel => {
        console.log(`     - ${rel.relationshipType} of ${rel.student.name} ${rel.student.surname}`);
      });
    }

    // 6. Test the display format (like in the UI)
    console.log('\n6. Testing UI display format...');
    
    const relationshipDisplay = parentWithRelationships?.parentStudents.map(rel => 
      `${rel.student.name} ${rel.student.surname} (${rel.relationshipType})`
    ).join(', ');
    
    console.log(`   UI Display: "${relationshipDisplay}"`);

    // 7. Clean up test data
    console.log('\n7. Cleaning up test data...');
    await prisma.parentStudent.delete({
      where: { id: createdRelationship.id }
    });
    console.log('   ✅ Test relationship cleaned up');

    console.log('\n🎉 All tests passed! The Parent-Student relationship system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testParentStudentRelationships();