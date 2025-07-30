import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getSchoolFilter } from "@/lib/school-context";
import { recordStudentFeeTransaction } from "@/lib/accounting-integration";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { reference, studentId, classFeeId, amount } = await req.json();

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json(
        { success: false, message: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Check if payment amount matches
    const paidAmount = paystackData.data.amount / 100; // Convert from kobo to cedis
    if (Math.abs(paidAmount - amount) > 0.01) { // Allow for small rounding differences
      return NextResponse.json(
        { success: false, message: "Payment amount mismatch" },
        { status: 400 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    // Check if payment already exists
    const existingPayment = await prisma.studentFee.findFirst({
      where: {
        studentId,
        classFeeId,
        // Add a custom field to track Paystack reference (we'll need to add this to schema)
        // For now, we'll check by amount and recent date
        amount: paidAmount,
        paidDate: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Within last 10 minutes
        }
      }
    });

    if (existingPayment) {
      return NextResponse.json(
        { success: false, message: "Payment already recorded" },
        { status: 400 }
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
        } : {}),
      },
      include: {
        studentFees: {
          where: { studentId },
        },
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
    });

    if (!classFee) {
      return NextResponse.json(
        { success: false, message: "Class fee not found" },
        { status: 404 }
      );
    }

    const totalPaid = classFee.studentFees.reduce(
      (sum, fee) => sum + fee.amount,
      0
    );

    if (totalPaid + paidAmount > classFee.amount) {
      return NextResponse.json(
        { success: false, message: "Payment amount exceeds the total fee" },
        { status: 400 }
      );
    }

    // Create the student fee record
    const studentFee = await prisma.studentFee.create({
      data: {
        amount: paidAmount,
        studentId,
        classFeeId,
        schoolId: schoolFilter.schoolId!,
      },
      include: {
        student: {
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
          },
        },
      },
    });

    // Record the payment in the accounting system
    await recordStudentFeeTransaction(
      studentFee.id,
      paidAmount,
      `${studentFee.student.name} ${studentFee.student.surname}`,
      classFee.feeType.name
    );

    // Send payment confirmation SMS to student and parents
    try {
      const { SMSService } = await import('@/lib/sms-service');
      const studentName = `${studentFee.student.name} ${studentFee.student.surname}`;
      const paymentMessage = SMSService.getPaymentConfirmationMessage(
        studentName,
        paidAmount,
        classFee.feeType.name,
        studentFee.student.school.name
      );

      // Get all phone numbers for the student (student + parents)
      const phoneNumbers = SMSService.getStudentPhoneNumbers(studentFee.student);
      
      // Send SMS to all available phone numbers
      for (const phone of phoneNumbers) {
        await SMSService.sendSMS(phone, paymentMessage);
      }
    } catch (smsError) {
      console.error('Failed to send payment confirmation SMS:', smsError);
      // Don't fail the payment if SMS fails
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and recorded successfully",
      studentFee,
      paystackReference: reference
    });

  } catch (error) {
    console.error("Error verifying Paystack payment:", error);
    return NextResponse.json(
      { success: false, message: "Error verifying payment" },
      { status: 500 }
    );
  }
}