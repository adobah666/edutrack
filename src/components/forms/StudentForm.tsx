"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  studentSchema,
  StudentSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import {
  createStudent,
  updateStudent,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import PasswordInput from "../PasswordInput";

const StudentForm = ({
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
    setValue,
    clearErrors,
    trigger,
    formState: { errors },
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      username: data?.username || "",
      password: data?.password || "",
      name: data?.name || "",
      otherNames: data?.otherNames || "",
      surname: data?.surname || "",
      address: data?.address || "",
      phone: data?.phone || "",
      bloodType: data?.bloodType || "",
      birthday: data?.birthday ? new Date(data.birthday) : new Date(),
      sex: data?.sex || "MALE",
      gradeId: data?.gradeId || "",
      classId: data?.classId || "",
      id: data?.id || undefined,
    }
  });

  const [img, setImg] = useState<any>(data?.img ? { secure_url: data.img } : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUsernameGenerated, setIsUsernameGenerated] = useState(false);

  const [state, formAction] = useFormState(
    type === "create" ? createStudent : updateStudent,
    {
      success: false,
      error: false,
      message: "",
    }
  );

  const router = useRouter();

  const onSubmit = handleSubmit(async (formData) => {
    try {
      setIsSubmitting(true);
      // Format the data properly for submission
      const userData = {
        ...formData,
        img: img?.secure_url || data?.img,
      };

      await formAction(userData);
      // The form state and any errors will be handled by the useEffect
    } catch (error) {
      console.error("Form submission error:", error);
      setIsSubmitting(false);
    }
  });

  useEffect(() => {
    if (state.success) {
      toast.success(`Student has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error(state.message || "Something went wrong!");
      setIsSubmitting(false); // Reset submit button state on error
    }
  }, [state, router, type, setOpen]);

  const { grades, classes, parents } = relatedData || { grades: [], classes: [], parents: [] };

  return (
    <form className="flex flex-col gap-8 max-h-[80vh] overflow-y-auto px-4" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new student" : "Update the student"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Username</label>
          <div className="flex gap-2">
            <input
              type="text"
              {...register("username")}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm flex-1"
            />
            <button
              type="button"
              onClick={async () => {
                const nameValue = (document.querySelector('input[name="name"]') as HTMLInputElement)?.value;
                const surnameValue = (document.querySelector('input[name="surname"]') as HTMLInputElement)?.value;
                const emailValue = (document.querySelector('input[name="email"]') as HTMLInputElement)?.value;
                
                if (!nameValue) {
                  toast.error("Please enter a name first");
                  return;
                }

                try {
                  const response = await fetch('/api/generate-username', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: nameValue,
                      surname: surnameValue,
                      email: emailValue,
                      userType: 'student'
                    })
                  });

                  if (!response.ok) throw new Error('Failed to generate username');
                  
                  const data = await response.json();
                  console.log('Generated username data:', data);
                  
                  // ULTIMATE NUCLEAR OPTION: Force complete field reset
                  clearErrors("username");
                  
                  // Clear the field completely
                  setValue("username", "", { shouldValidate: false });
                  
                  // Force a small delay to ensure React has processed the empty state
                  await new Promise(resolve => setTimeout(resolve, 100));
                  
                  // Set the new value and force validation
                  setValue("username", data.username, { 
                    shouldValidate: false,  // Don't validate immediately
                    shouldDirty: true,
                    shouldTouch: true 
                  });
                  
                  // Clear errors again after setting the value
                  clearErrors("username");
                  
                  // Force trigger validation after another delay
                  setTimeout(async () => {
                    clearErrors("username");
                    await trigger("username");
                  }, 200);
                  
                  toast.success(`Username generated: ${data.username}`);
                } catch (error) {
                  toast.error("Failed to generate username");
                }
              }}
              className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 text-sm whitespace-nowrap"
              title="Generate username automatically"
            >
              🎲 Generate
            </button>
          </div>
          {errors?.username && (
            <p className="text-xs text-red-400">
              {errors.username.message?.toString()}
            </p>
          )}
        </div>
        <PasswordInput
          label="Password"
          name="password"
          register={register}
          error={errors?.password}
          className="w-full md:w-1/4"
          showGenerateButton={true}
          onGeneratePassword={async () => {
            const nameValue = (document.querySelector('input[name="name"]') as HTMLInputElement)?.value;
            const surnameValue = (document.querySelector('input[name="surname"]') as HTMLInputElement)?.value;
            
            if (!nameValue) {
              toast.error("Please enter a name first");
              return;
            }

            try {
              const response = await fetch('/api/generate-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: nameValue,
                  surname: surnameValue,
                  userType: 'student'
                })
              });

              if (!response.ok) throw new Error('Failed to generate password');
              
              const data = await response.json();
              
              setValue("password", data.password, { 
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true 
              });
              
              toast.success(`Password generated: ${data.password}`);
            } catch (error) {
              toast.error("Failed to generate password");
            }
          }}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Personal Information
      </span>
      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Profile Photo</label>
        <div className="flex items-center gap-4">
          {img && (
            <div className="relative h-32 w-32 rounded-md overflow-hidden border border-gray-300">
              <Image
                src={img.secure_url || img}
                alt="Student profile"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
          <CldUploadWidget
            uploadPreset="school"
            onSuccess={(result, { widget }) => {
              setImg(result.info);
              widget.close();
            }}
          >
            {({ open }) => {
              return (
                <div
                  className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
                  onClick={() => open()}
                >
                  <Image src="/upload.png" alt="" width={28} height={28} />
                  <span>{img ? "Change photo" : "Upload a photo"}</span>
                </div>
              );
            }}
          </CldUploadWidget>
        </div>
      </div>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="First Name"
          name="name"
          register={register}
          error={errors.name}
        />
        <InputField
          label="Other Names"
          name="otherNames"
          register={register}
          error={errors.otherNames}
        />
        <InputField
          label="Last Name"
          name="surname"
          register={register}
          error={errors.surname}
        />
        <InputField
          label="Address"
          name="address"
          register={register}
          error={errors.address}
        />
        <InputField
          label="Phone (Optional)"
          name="phone"
          register={register}
          error={errors.phone}
          type="tel"
        />
        <InputField
          label="Blood Type"
          name="bloodType"
          register={register}
          error={errors.bloodType}
        />
        <InputField
          label="Birthday"
          name="birthday"
          register={register}
          error={errors.birthday}
          type="date"
        />
        {data && (
          <InputField
            label="Id"
            name="id"
            register={register}
            error={errors?.id}
            hidden
          />
        )}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sex</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("sex")}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">
              {errors.sex.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Grade</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("gradeId")}
            defaultValue={data?.gradeId || ""}
          >
            <option value="">Select a grade</option>
            {Array.isArray(grades) && grades.length > 0 ? (
              grades.map((grade: { id: number; name: string }) => (
                <option
                  value={grade.id}
                  key={grade.id}
                >
                  {grade.name}
                </option>
              ))
            ) : (
              <option value="" disabled>No grades available</option>
            )}
          </select>
          {errors.gradeId?.message && (
            <p className="text-xs text-red-400">
              {errors.gradeId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Class</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("classId")}
          >
            {classes && classes.length > 0 ? (
              classes.map(
                (classItem: {
                  id: number;
                  name: string;
                  capacity: number;
                  _count: { students: number };
                }) => (
                  <option value={classItem.id} key={classItem.id}>
                    {classItem.name} - {classItem._count?.students || 0}/{classItem.capacity} Capacity
                  </option>
                )
              )
            ) : (
              <option value="">No classes available</option>
            )}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">
              {errors.classId.message.toString()}
            </p>
          )}
        </div>

      </div>
      <button
        type="submit"
        className="bg-blue-400 text-white p-2 rounded-md hover:bg-blue-500 transition-colors disabled:bg-gray-300"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "Processing..."
          : type === "create"
            ? "Create Student"
            : "Update Student"
        }
      </button>
    </form>
  );
};

export default StudentForm;