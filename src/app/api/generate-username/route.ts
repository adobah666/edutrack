import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const schoolFilter = await getSchoolFilter();
    if (!schoolFilter.schoolId) {
      return NextResponse.json(
        { message: "School context not found" },
        { status: 400 }
      );
    }

    const { name, surname, email, userType } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    // Generate base username from name
    const generateBaseUsername = (name: string, surname?: string, email?: string) => {
      // Option 1: Use email prefix if available
      if (email && email.includes('@')) {
        const emailPrefix = email.split('@')[0].toLowerCase();
        // Clean the email prefix (remove special characters)
        return emailPrefix.replace(/[^a-z0-9]/g, '');
      }

      // Option 2: Use name + surname
      if (surname) {
        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanSurname = surname.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${cleanName}_${cleanSurname}`;
      }

      // Option 3: Use just name
      return name.toLowerCase().replace(/[^a-z]/g, '');
    };

    const baseUsername = generateBaseUsername(name, surname, email);
    console.log(`Generated base username: ${baseUsername} from name: ${name}, surname: ${surname}, email: ${email}`);

    // Generate username with random 4-digit number for uniqueness (max 20 chars)
    const generateUniqueUsername = async (base: string): Promise<string> => {
      let attempts = 0;
      const maxAttempts = 10;
      const maxLength = 20;

      while (attempts < maxAttempts) {
        // Generate a random 4-digit number
        const randomNumber = Math.floor(1000 + Math.random() * 9000);
        let username = `${base}_${randomNumber}`;
        
        // Truncate if too long (keep the random number, truncate the base)
        if (username.length > maxLength) {
          const availableBaseLength = maxLength - 5; // 5 chars for "_1234"
          const truncatedBase = base.substring(0, availableBaseLength);
          username = `${truncatedBase}_${randomNumber}`;
        }
        
        console.log(`Checking username: ${username} (length: ${username.length})`);
        
        // Check both Clerk and local database
        const [clerkExists, localExists] = await Promise.all([
          checkUsernameInClerk(username),
          checkUsernameExists(username, userType, schoolFilter.schoolId as string)
        ]);
        
        console.log(`Username ${username} - Clerk exists: ${clerkExists}, Local exists: ${localExists}`);
        
        if (!clerkExists && !localExists) {
          console.log(`Username ${username} is available!`);
          return username;
        }

        attempts++;
      }

      // Fallback: use timestamp if all random attempts fail (ensure it fits in 20 chars)
      const timestamp = Date.now().toString().slice(-4);
      const availableBaseLength = maxLength - 5; // 5 chars for "_1234"
      const truncatedBase = base.substring(0, availableBaseLength);
      const fallbackUsername = `${truncatedBase}_${timestamp}`;
      console.log(`Using fallback username: ${fallbackUsername} (length: ${fallbackUsername.length})`);
      return fallbackUsername;
    };

    const uniqueUsername = await generateUniqueUsername(baseUsername);

    console.log(`Generated unique username: ${uniqueUsername} for base: ${baseUsername}`);

    return NextResponse.json({ 
      username: uniqueUsername,
      suggestions: [
        uniqueUsername,
        `${baseUsername}${new Date().getFullYear()}`,
        `${baseUsername}${Math.floor(Math.random() * 100)}`,
      ]
    });

  } catch (error: any) {
    console.error("Error generating username:", error);
    return NextResponse.json(
      { message: "Error generating username" },
      { status: 500 }
    );
  }
}

async function checkUsernameInClerk(username: string): Promise<boolean> {
  try {
    console.log(`Checking Clerk for username: ${username}`);
    const existingUsers = await clerkClient().users.getUserList({
      username: [username],
    });
    console.log(`Clerk check result for ${username}: ${existingUsers.totalCount} users found`);
    return existingUsers.totalCount > 0;
  } catch (error) {
    console.error("Error checking username in Clerk:", error);
    return true; // Return true to be safe if there's an error
  }
}

async function checkUsernameExists(username: string, userType: string, schoolId: string): Promise<boolean> {
  try {
    console.log(`Checking local database for username: ${username} in school: ${schoolId}`);
    
    // Always check ALL user types regardless of userType parameter
    // This ensures we don't have conflicts across different user types
    const [student, teacher, parent, admin] = await Promise.all([
      prisma.student.findFirst({ 
        where: { username, schoolId },
        select: { id: true, username: true }
      }),
      prisma.teacher.findFirst({ 
        where: { username, schoolId },
        select: { id: true, username: true }
      }),
      prisma.parent.findFirst({ 
        where: { username, schoolId },
        select: { id: true, username: true }
      }),
      prisma.admin.findFirst({ 
        where: { username, schoolId },
        select: { id: true, username: true }
      })
    ]);

    const existingUser = student || teacher || parent || admin;
    console.log(`Local DB check result for ${username}:`, {
      student: !!student,
      teacher: !!teacher, 
      parent: !!parent,
      admin: !!admin,
      exists: !!existingUser
    });

    return !!existingUser;
  } catch (error) {
    console.error("Error checking username in local database:", error);
    return true; // Return true to be safe if there's an error
  }
}