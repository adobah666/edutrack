import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";

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
        const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
        const cleanSurname = surname.toLowerCase().replace(/[^a-z]/g, '');
        return `${cleanName}.${cleanSurname}`;
      }

      // Option 3: Use just name
      return name.toLowerCase().replace(/[^a-z]/g, '');
    };

    const baseUsername = generateBaseUsername(name, surname, email);

    // Check if username exists and generate unique one
    const generateUniqueUsername = async (base: string): Promise<string> => {
      let username = base;
      let counter = 1;

      while (true) {
        // Since we checked schoolFilter.schoolId at the start, we know it's not null here
        const existingUser = await checkUsernameExists(username, userType, schoolFilter.schoolId as string);
        
        if (!existingUser) {
          return username;
        }

        // If exists, add number suffix
        username = `${base}${counter}`;
        counter++;

        // Prevent infinite loop
        if (counter > 999) {
          throw new Error("Unable to generate unique username");
        }
      }
    };

    const uniqueUsername = await generateUniqueUsername(baseUsername);

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

async function checkUsernameExists(username: string, userType: string, schoolId: string): Promise<boolean> {
  try {
    let existingUser = null;

    switch (userType) {
      case 'student':
        existingUser = await prisma.student.findFirst({
          where: { 
            username,
            schoolId 
          }
        });
        break;
      case 'teacher':
        existingUser = await prisma.teacher.findFirst({
          where: { 
            username,
            schoolId 
          }
        });
        break;
      case 'parent':
        existingUser = await prisma.parent.findFirst({
          where: { 
            username,
            schoolId 
          }
        });
        break;
      default:
        // Check all tables if userType not specified
        const [student, teacher, parent] = await Promise.all([
          prisma.student.findFirst({ where: { username, schoolId } }),
          prisma.teacher.findFirst({ where: { username, schoolId } }),
          prisma.parent.findFirst({ where: { username, schoolId } })
        ]);
        existingUser = student || teacher || parent;
    }

    return !!existingUser;
  } catch (error) {
    console.error("Error checking username:", error);
    return true; // Return true to be safe if there's an error
  }
}