// Script to create a new Clerk user and make them a super admin
require('dotenv').config();
const { Clerk } = require('@clerk/clerk-sdk-node');
const { PrismaClient } = require('@prisma/client');

// Initialize Clerk with your secret key from .env
const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
const prisma = new PrismaClient();

// Define the new user details
const newUser = {
  username: 'superadmin2023',
  password: 'Sch00lM@nager2025!XYZ',  // More complex password
  firstName: 'Super',
  lastName: 'Admin',
  emailAddress: ['superadmin@example.com'],
};

async function main() {
  try {
    console.log('Creating new Clerk user...');
    
    // Create the user in Clerk
    const clerkUser = await clerk.users.createUser({
      username: newUser.username,
      password: newUser.password,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      emailAddress: newUser.emailAddress,
      publicMetadata: { role: 'admin', adminRole: 'SUPER_ADMIN' },
    });
    
    console.log('Clerk user created successfully:', {
      id: clerkUser.id,
      username: clerkUser.username,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
    });
    
    // Create the super admin in the database
    const superAdmin = await prisma.admin.create({
      data: {
        id: clerkUser.id,
        username: newUser.username,
        name: newUser.firstName,
        surname: newUser.lastName,
        email: newUser.emailAddress[0],
        role: 'SUPER_ADMIN',
      }
    });
    
    console.log('Super admin created in database:', superAdmin);
    console.log('\n===== LOGIN CREDENTIALS =====');
    console.log(`Username: ${newUser.username}`);
    console.log(`Password: ${newUser.password}`);
    console.log('=============================');
    
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();