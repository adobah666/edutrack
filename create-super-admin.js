// Script to create a super admin user
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get your Clerk user ID
    // You need to replace this with your actual Clerk user ID
    const clerkUserId = process.argv[2];
    
    if (!clerkUserId) {
      console.error('Please provide your Clerk user ID as an argument');
      console.error('Usage: node create-super-admin.js your-clerk-user-id');
      process.exit(1);
    }

    // Create the super admin
    const superAdmin = await prisma.admin.create({
      data: {
        id: clerkUserId,
        username: 'adminhmh', // Using the actual username from Clerk
        name: 'John',
        surname: 'Afful',
        role: 'SUPER_ADMIN',
        // schoolId is null for super admin
      }
    });

    console.log('Super admin created successfully:', superAdmin);
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();