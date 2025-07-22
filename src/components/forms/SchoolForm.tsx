"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { createSchool, updateSchool } from "@/lib/school-actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "School name is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
  phone: z.string().optional(),
  email: z.string().email({ message: "Invalid email address!" }).optional().or(z.literal("")),
  logo: z.string().optional(),
});

type SchoolSchema = z.infer<typeof schema>;

const SchoolForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: (open: boolean) => void;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolSchema>({
    resolver: zodResolver(schema),
    defaultValues: data,
  });

  const [state, formAction] = useFormState(
    type === "create" ? createSchool : updateSchool,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`School has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new school" : "Update school"}
      </h1>

      {state.error && (
        <span className="text-red-500">
          {state.message || "Something went wrong!"}
        </span>
      )}

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="School Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Address"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors?.address}
        />
        <InputField
          label="Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors?.phone}
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Logo URL"
          name="logo"
          defaultValue={data?.logo}
          register={register}
          error={errors?.logo}
        />
      </div>

      {type === "update" && (
        <input type="hidden" name="id" value={data?.id} />
      )}

      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default SchoolForm;