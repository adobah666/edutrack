"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { teacherSchema, TeacherSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";

interface FormState {
  success: boolean;
  error: boolean;
  message?: string;
}

interface TeacherFormData extends TeacherSchema {
  img?: string;
}

const TeacherForm = ({
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
    formState: { errors },
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
  });

  const [img, setImg] = useState<any>(data?.img ? { secure_url: data.img } : undefined);

  const [state, formAction] = useFormState<
    FormState,
    TeacherSchema
  >(async (_, formData) => {
    try {
      const action = type === "create" ? createTeacher : updateTeacher;
      const result = await action({ success: false, error: false }, formData);
      return result as FormState;
    } catch (error) {
      return {
        success: false,
        error: true,
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      };
    }
  }, {
    success: false,
    error: false
  });

  const onSubmit = handleSubmit(async (formData: TeacherSchema) => {
    try {
      const enrichedData = {
        ...formData,
        img: img?.secure_url
      };
      formAction(enrichedData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(
        `Teacher has been ${type === "create" ? "created" : "updated"}!`
      );
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error("message" in state ? state.message : "An error occurred while saving the teacher");
    }
  }, [state, router, type, setOpen]);

  const { subjects } = relatedData;

  return (
    <form
      className="flex flex-col gap-8 max-h-[80vh] overflow-y-auto px-4"
      onSubmit={onSubmit}
    >
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new teacher" : "Update the teacher"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      {/* Username field on its own row to prevent overlap */}
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <label className="text-xs text-gray-500">Username</label>
          <div className="flex gap-2">
            <input
              type="text"
              {...register("username")}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm flex-1"
              defaultValue={data?.username}
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
                      userType: 'teacher'
                    })
                  });

                  if (!response.ok) throw new Error('Failed to generate username');
                  
                  const data = await response.json();
                  
                  // Use React Hook Form's setValue to properly update the form state
                  setValue("username", data.username, { 
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true 
                  });
                  
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
      </div>
      
      {/* Email and Password on separate row */}
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Email"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          defaultValue={data?.password}
          register={register}
          error={errors?.password}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Personal Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="First Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />
        <InputField
          label="Last Name"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors.surname}
        />
        <InputField
          label="Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors.phone}
        />
        <InputField
          label="Address"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors.address}
        />
        <InputField
          label="Blood Type"
          name="bloodType"
          defaultValue={data?.bloodType}
          register={register}
          error={errors.bloodType}
        />
        <InputField
          label="Birthday"
          name="birthday"
          defaultValue={data?.birthday.toISOString().split("T")[0]}
          register={register}
          error={errors.birthday}
          type="date"
        />
        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
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
            defaultValue={data?.sex}
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
          <label className="text-xs text-gray-500">Subjects</label>
          <select
            multiple
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("subjects")}
            defaultValue={data?.subjects}
          >
            {subjects.map((subject: { id: number; name: string }) => (
              <option value={subject.id} key={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjects?.message && (
            <p className="text-xs text-red-400">
              {errors.subjects.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Profile Photo</label>
          <div className="flex items-center gap-4">
            {img?.secure_url && (
              <div className="relative h-20 w-20 rounded-md overflow-hidden border border-gray-300">
                <Image
                  src={img.secure_url}
                  alt="Teacher profile"
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
                    <span>{img?.secure_url ? "Change photo" : "Upload a photo"}</span>
                  </div>
                );
              }}
            </CldUploadWidget>
          </div>
        </div>
      </div>
      {state.error && (
        <span className="text-red-500">
          {"message" in state ? state.message : "Something went wrong!"}
        </span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default TeacherForm;
