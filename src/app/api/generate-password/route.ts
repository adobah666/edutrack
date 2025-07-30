import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, surname, userType } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required to generate password" },
        { status: 400 }
      );
    }

    // Generate a secure password that meets Clerk's requirements
    const generatePassword = (name: string, surname?: string, userType?: string) => {
      const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
      const cleanSurname = surname ? surname.toLowerCase().replace(/[^a-z]/g, '') : '';
      
      // Special characters for complexity
      const specialChars = ['!', '@', '#', '$', '%', '&', '*'];
      const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
      
      // Generate random numbers and uppercase letter
      const randomNum = Math.floor(Math.random() * 999) + 100;
      const uppercaseLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
      
      // Create password based on user type with complexity
      let password = '';
      
      if (userType === 'student') {
        // For students: Firstname + Uppercase + Lastname + Special + Numbers
        password = `${cleanName.charAt(0).toUpperCase()}${cleanName.slice(1)}${uppercaseLetter}${cleanSurname}${randomSpecial}${randomNum}`;
      } else if (userType === 'parent') {
        // For parents: Firstname + Uppercase + "Parent" + Special + Numbers
        password = `${cleanName.charAt(0).toUpperCase()}${cleanName.slice(1)}${uppercaseLetter}Parent${randomSpecial}${randomNum}`;
      } else if (userType === 'teacher') {
        // For teachers: Firstname + Uppercase + "Teacher" + Special + Numbers
        password = `${cleanName.charAt(0).toUpperCase()}${cleanName.slice(1)}${uppercaseLetter}Teacher${randomSpecial}${randomNum}`;
      } else {
        // Default: Firstname + Uppercase + Special + Numbers
        password = `${cleanName.charAt(0).toUpperCase()}${cleanName.slice(1)}${uppercaseLetter}${randomSpecial}${randomNum}`;
      }

      // Ensure minimum length of 8 characters with additional complexity if needed
      if (password.length < 8) {
        const additionalSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
        const additionalNum = Math.floor(Math.random() * 99) + 10;
        password += `${additionalSpecial}${additionalNum}`;
      }

      return password;
    };

    const password = generatePassword(name, surname, userType);

    return NextResponse.json({
      success: true,
      password: password,
    });

  } catch (error) {
    console.error("Error generating password:", error);
    return NextResponse.json(
      { error: "Failed to generate password" },
      { status: 500 }
    );
  }
}