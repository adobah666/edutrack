const { PrismaClient } = require('@prisma/client');
const { clerkClient } = require('@clerk/clerk-sdk-node');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🚀 Creating Super Admin...');

    // Create a new user in Clerk first
    const superAdminUser = await clerkClient.users.createUser({
      emailAddress: ['superadmin@edutrack.com'],
      username: 'superadmin',
      password: 'SuperAdmin2025!',
      firstName: 'Super',
      lastName: 'Admin',
      publicMetadata: {
        role: 'admin',
        adminRole: 'SUPER_ADMIN'
      }
    });

    console.log(`✅ Created Clerk user: ${superAdminUser.emailAddresses[0].emailAddress}`);

    // Create the super admin in the database
    const admin = await prisma.admin.create({
      data: {
        id: superAdminUser.id,
        username: 'superadmin',
        name: 'Super',
        surname: 'Admin',
        email: 'superadmin@edutrack.com',
        role: 'SUPER_ADMIN',
        schoolId: null, // Super admin doesn't belong to any specific school
      }
    });

    console.log(`✅ Super Admin created successfully:`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   School Access: All Schools`);
    
    console.log('\n🎉 Super Admin Setup Complete!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: superadmin@edutrack.com`);
    console.log(`   Password: SuperAdmin2025!`);
    console.log('\n🔐 This super admin can:');
    console.log('   • Access all schools');
    console.log('   • Create new schools');
    console.log('   • Manage school admins');
    console.log('   • View system-wide data');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`   - ${err.message}`);
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();