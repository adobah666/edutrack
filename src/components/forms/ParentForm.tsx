"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { parentSchema, ParentSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createParent, updateParent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";

interface Student {
  id: number;
  name: string;
  surname: string;
}

const ParentForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ParentSchema>({
    resolver: zodResolver(parentSchema), defaultValues: {
      username: data?.username || "",
      password: data?.password || "",
      name: data?.name || "",
      surname: data?.surname || "",
      email: data?.email || "",
      phone: data?.phone || "",
      address: data?.address || "",
      id: data?.id,
      studentIds: data?.students?.map((s: any) => s.id) || [],
      img: data?.img || ""
    }
  });  // Initialize with the existing image if available
  const [img, setImg] = useState<any>(data?.img ? { secure_url: data.img } : null);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStudents, setCurrentStudents] = useState<Student[]>(data?.students || []);
  const { grades, students } = relatedData || { grades: [], students: [] };
  type FormState = {
    success: boolean;
    error: boolean;
    message?: string;
    field?: string;
  }

  const [state, formAction] = useFormState<FormState, any>(
    type === "create" ? createParent : updateParent,
    {
      success: false,
      error: false,
      message: ""
    }
  );

  const onSubmit = handleSubmit(async (formData) => {
    try {
      setIsSubmitting(true);
      const formDataWithImage = {
        ...formData,
        studentIds: currentStudents.map(student => student.id),
        img: img?.secure_url || ""
      };

      await formAction(formDataWithImage);

    } catch (error) {
      console.error('Form submission error:', error);
      setIsSubmitting(false);
      if (error instanceof Error) {
        if (error.message.includes('internal_clerk_error')) {
          toast.error("Authentication service is temporarily unavailable. Please try again later.");
        } else {
          toast.error(error.message || "An error occurred while submitting the form");
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  });

  const router = useRouter();
  useEffect(() => {
    if (state && state.success) {
      toast.success(`Parent has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
      setIsSubmitting(false);
    } else if (state && state.error) {
      // Show field-specific error if available
      if (state.field === "phone") {
        toast.error("This phone number is already registered to another parent.");
      } else {
        toast.error(state.message || "Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  }, [state, type, setOpen, router]);
  const removeStudent = (studentId: number) => {
    setCurrentStudents((prev: Student[]) => prev.filter((s) => s.id !== studentId));
  };

  // Handle checkbox changes
  const handleStudentCheckbox = (student: Student, checked: boolean) => {
    if (checked) {
      setCurrentStudents(prev => [...prev, student]);
    } else {
      setCurrentStudents(prev => prev.filter(s => s.id !== student.id));
    }
  };

  return (
    <form className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto px-4" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold mb-2">
        {type === "create" ? "Create a new parent" : "Update the parent"}
      </h1>
      <span className="text-xs text-gray-400 font-medium mb-1">
        Authentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          register={register}
          error={errors?.password}
        />
        <InputField
          label="Email"
          name="email"
          register={register}
          error={errors?.email}
        />      </div>
      <span className="text-xs text-gray-400 font-medium mb-1">
        Personal Information
      </span>
      <div className="flex justify-between flex-wrap gap-3 mb-2">
        <InputField
          label="First Name"
          name="name"
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Last Name"
          name="surname"
          register={register}
          error={errors?.surname}
        />
        <InputField
          label="Phone"
          name="phone"
          register={register}
          error={errors?.phone}
        />
        <InputField
          label="Address"
          name="address"
          register={register}
          error={errors?.address}
        />      </div>
      <span className="text-xs text-gray-400 font-medium mb-1">Students</span>

      {type === "update" && currentStudents.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-2">Currently assigned students:</p>
          <div className="flex flex-wrap gap-2">
            {currentStudents.map((student: any) => (
              <div key={student.id} className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                <span className="text-sm">{student.name} {student.surname}</span>
                <button
                  type="button"
                  onClick={() => removeStudent(student.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 border rounded-lg p-4 bg-white shadow-sm">
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter Students by Grade
          </label>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full md:w-1/3 border-gray-300 focus:ring-lamaPurple focus:border-lamaPurple"
          >
            <option value="">All Grades</option>
            {grades?.map((grade: any) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Students
          </label>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 border rounded-md bg-gray-50">
            {students?.length === 0 ? (
              <p className="text-sm text-gray-500">No students available</p>
            ) : (
              students
                ?.filter((student: any) => !selectedGrade || student.gradeId === parseInt(selectedGrade))
                .map((student: any) => {
                  const isAssigned = currentStudents.some(s => s.id === student.id);
                  return (
                    <label
                      key={student.id}
                      className="flex items-center gap-2 bg-white p-2 rounded shadow-sm hover:bg-gray-50 transition-colors cursor-pointer min-w-[200px]"
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={(e) => handleStudentCheckbox(student, e.target.checked)}
                        className="form-checkbox h-4 w-4 text-lamaPurple rounded"
                      />
                      <span className="text-sm">{student.name} {student.surname}</span>
                    </label>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {errors?.studentIds && (
        <span className="text-xs text-red-500 mb-1">
          {errors.studentIds.message}
        </span>
      )}

      <div className="flex flex-col gap-2 w-full mb-4">
        <label className="text-xs text-gray-500">Profile Photo</label>
        <div className="flex items-center gap-4">
          {img?.secure_url && (
            <div className="relative h-32 w-32 rounded-md overflow-hidden border border-gray-300">
              <Image
                src={img.secure_url}
                alt="Parent profile"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
          <CldUploadWidget
            uploadPreset="school"
            options={{
              maxFiles: 1,
              resourceType: "image",
              clientAllowedFormats: ["jpg", "jpeg", "png", "gif"]
            }}
            onSuccess={(result: any, { widget }: any) => {
              console.log("Upload success, result:", result);
              setImg(result.info);
              widget.close();
            }}
            onError={(error: any) => {
              console.error("Upload error:", error);
              toast.error("Image upload failed. Please try again.");
            }}
          >
            {({ open }) => (
              <div className="flex flex-col items-start">
                <button
                  type="button"
                  className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0"
                  onClick={() => open()}
                >
                  <Image
                    src="/upload.png"
                    alt="Upload"
                    width={28}
                    height={28}
                    priority
                  />
                  <span>{img?.secure_url ? "Change photo" : "Upload a photo"}</span>
                </button>
                <span className="text-xs text-gray-400 mt-1">
                  Supported formats: JPG, PNG, GIF
                </span>
              </div>
            )}
          </CldUploadWidget>
        </div>
      </div>      <button
        type="submit"
        className="p-4 bg-lamaPurple w-full text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "Processing..."
          : type === "create"
            ? "Create Parent"
            : "Update Parent"
        }
      </button>
    </form>
  );
};

export default ParentForm;