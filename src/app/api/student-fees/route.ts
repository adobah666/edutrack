import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getSchoolFilter } from "@/lib/school-context";
import { recordStudentFeeTransaction } from "@/lib/accounting-integration";

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json(
        { message: "Not authorized" },
        { status: 401 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    const formData = await req.formData();
    const amount = parseFloat(formData.get("amount") as string);
    const studentId = formData.get("studentId") as string;
    const classFeeId = parseInt(formData.get("classFeeId") as string);
    const adminPassword = formData.get("adminPassword") as string;

    // Verify admin password is provided
    if (!adminPassword || adminPassword.length < 6) {
      return NextResponse.json(
        { message: "Please enter a valid password for verification." },
        { status: 403 }
      );
    }

    // Validate if the payment amount is valid (with school filtering)
    const classFee = await prisma.classFee.findFirst({
      where: { 
        id: classFeeId,
        ...(schoolFilter.schoolId ? {
          class: {
            schoolId: schoolFilter.schoolId
          }
        } : {}), // Add school filtering through class relationship
      },
      include: {
        studentFees: {
          where: { studentId },
        },
      },
    });

    if (!classFee) {
      return NextResponse.json(
        { message: "Class fee not found" },
        { status: 404 }
      );
    }

    const totalPaid = classFee.studentFees.reduce(
      (sum, fee) => sum + fee.amount,
      0
    );

    if (totalPaid + amount > classFee.amount) {
      return NextResponse.json(
        { message: "Payment amount exceeds the total fee" },
        { status: 400 }
      );
    }    const studentFee = await prisma.studentFee.create({
      data: {
        amount,
        studentId,
        classFeeId,
        schoolId: schoolFilter.schoolId!,
      },
      include: {
        student: {
          select: {
            name: true,
            surname: true,
          },
        },
        classFee: {
          include: {
            class: {
              select: {
                name: true,
              },
            },
            feeType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Calculate total paid amount including this new payment
    const allPayments = await prisma.studentFee.findMany({
      where: {
        studentId,
        classFeeId,
      },
    });

    const totalPaidAmount = allPayments.reduce((sum, p) => sum + p.amount, 0);

    // Record the payment in the accounting system
    await recordStudentFeeTransaction(
      studentFee.id,
      amount,
      `${studentFee.student.name} ${studentFee.student.surname}`,
      studentFee.classFee.feeType.name
    );

    // Send payment confirmation SMS to student and parents
    try {
      // Get student with parent information and school details for SMS
      const studentWithDetails = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
          name: true,
          surname: true,
          phone: true,
          school: {
            select: {
              name: true
            }
          },
          parentStudents: {
            select: {
              parent: {
                select: {
                  phone: true
                }
              }
            }
          }
        }
      });

      if (studentWithDetails) {
        const { SMSService } = await import('@/lib/sms-service');
        const studentName = `${studentWithDetails.name} ${studentWithDetails.surname}`;
        
        // Calculate remaining balance after this payment
        const remainingBalance = classFee.amount - totalPaidAmount;
        
        const paymentMessage = SMSService.getPaymentConfirmationWithBalanceMessage(
          studentName,
          amount,
          studentFee.classFee.feeType.name,
          studentWithDetails.school.name,
          remainingBalance,
          classFee.amount
        );

        // Get all phone numbers for the student (student + parents)
        const phoneNumbers = SMSService.getStudentPhoneNumbers(studentWithDetails);
        
        // Send SMS to all available phone numbers
        for (const phone of phoneNumbers) {
          await SMSService.sendSMS(phone, paymentMessage);
        }
      }
    } catch (smsError) {
      console.error('Failed to send payment confirmation SMS:', smsError);
      // Don't fail the payment creation if SMS fails
    }

    return NextResponse.json({
      ...studentFee,
      totalPaidAmount,
    });
  } catch (error) {
    console.error("Error creating student fee:", error);
    return NextResponse.json(
      { message: "Error creating student fee" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    let whereClause: any = schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {};
    
    if (studentId) {
      whereClause.studentId = studentId;
    }

    const studentFees = await prisma.studentFee.findMany({
      where: whereClause,
      include: {
        student: true,
        classFee: {
          include: {
            class: true,
            feeType: true,
          },
        },
      },
      orderBy: { paidDate: "desc" },
    });

    return NextResponse.json(studentFees);
  } catch (error) {
    console.error("Error fetching student fees:", error);
    return NextResponse.json(
      { message: "Error fetching student fees" },
      { status: 500 }
    );
  }
}
