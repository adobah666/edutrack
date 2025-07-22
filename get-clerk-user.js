// Script to get your Clerk user ID
require('dotenv').config();
const { Clerk } = require('@clerk/clerk-sdk-node');

// Initialize Clerk with your secret key from .env
const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

async function main() {
  try {
    // Get the first user (assuming it's your admin account)
    const users = await clerk.users.getUserList({
      limit: 10,
    });

    if (users.length === 0) {
      console.log('No users found in Clerk');
      return;
    }

    console.log('Available Clerk users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Username: ${user.username}, Name: ${user.firstName} ${user.lastName}`);
    });
    
  } catch (error) {
    console.error('Error fetching Clerk users:', error);
  }
}

main();