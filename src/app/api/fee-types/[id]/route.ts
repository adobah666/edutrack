import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const schoolFilter = await getSchoolFilter();
    if (!schoolFilter.schoolId) {
      return NextResponse.json(
        { message: "School context not found" },
        { status: 400 }
      );
    }

    const feeTypeId = parseInt(params.id);
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const isOptional = formData.get("isOptional") === "true";

    if (!name) {
      return NextResponse.json(
        { message: "Fee type name is required" },
        { status: 400 }
      );
    }

    // Check if fee type exists and belongs to the school
    const existingFeeType = await prisma.feeType.findFirst({
      where: {
        id: feeTypeId,
        schoolId: schoolFilter.schoolId
      }
    });

    if (!existingFeeType) {
      return NextResponse.json(
        { message: "Fee type not found" },
        { status: 404 }
      );
    }

    // Check if another fee type with this name already exists (excluding current one)
    const duplicateFeeType = await prisma.feeType.findFirst({
      where: {
        name,
        schoolId: schoolFilter.schoolId,
        NOT: { id: feeTypeId }
      }
    });

    if (duplicateFeeType) {
      return NextResponse.json(
        { message: `A fee type named "${name}" already exists in your school` },
        { status: 400 }
      );
    }

    const updatedFeeType = await prisma.feeType.update({
      where: { id: feeTypeId },
      data: {
        name,
        description,
        isOptional,
      },
    });

    return NextResponse.json(updatedFeeType);
  } catch (error: any) {
    console.error("Error updating fee type:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: "A fee type with this name already exists in your school" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Error updating fee type" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const schoolFilter = await getSchoolFilter();
    if (!schoolFilter.schoolId) {
      return NextResponse.json(
        { message: "School context not found" },
        { status: 400 }
      );
    }

    const feeTypeId = parseInt(params.id);

    // Check if fee type exists and belongs to the school
    const existingFeeType = await prisma.feeType.findFirst({
      where: {
        id: feeTypeId,
        schoolId: schoolFilter.schoolId
      }
    });

    if (!existingFeeType) {
      return NextResponse.json(
        { message: "Fee type not found" },
        { status: 404 }
      );
    }

    // Check if fee type is being used in any class fees
    const classFeeCount = await prisma.classFee.count({
      where: { feeTypeId }
    });

    if (classFeeCount > 0) {
      return NextResponse.json(
        { message: "Cannot delete fee type that is being used in class fees" },
        { status: 400 }
      );
    }

    await prisma.feeType.delete({
      where: { id: feeTypeId }
    });

    return NextResponse.json({ message: "Fee type deleted successfully" });
  } catch (error) {
    console.error("Error deleting fee type:", error);
    return NextResponse.json(
      { message: "Error deleting fee type" },
      { status: 500 }
    );
  }
}