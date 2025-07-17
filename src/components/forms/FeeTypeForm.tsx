"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { z } from "zod";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useEffect } from "react";

// Define the schema
const feeTypeSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Fee type name is required!" }),
  description: z.string().optional(),
});

type FeeTypeSchema = z.infer<typeof feeTypeSchema>;

const FeeTypeForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: (open: boolean) => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FeeTypeSchema>({
    resolver: zodResolver(feeTypeSchema),
  });

  const [state, formAction] = useFormState(
    async (prevState: any, formData: FormData) => {
      try {
        const url = type === "create" ? "/api/fee-types" : `/api/fee-types/${data?.id}`;
        const method = type === "create" ? "POST" : "PUT";

        const response = await fetch(url, {
          method,
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          return { ...prevState, error: true, message: error.message };
        }

        return { ...prevState, success: true };
      } catch (error) {
        return { ...prevState, error: true, message: "An error occurred" };
      }
    },
    { success: false, error: false, message: "" }
  );

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Fee type ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error(state.message || "Something went wrong!");
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create Fee Type" : "Update Fee Type"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Fee Type Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Description (Optional)</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full h-32"
            {...register("description")}
            defaultValue={data?.description}
          />
          {errors.description?.message && (
            <p className="text-xs text-red-400">
              {errors.description.message.toString()}
            </p>
          )}
        </div>

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
      </div>

      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default FeeTypeForm;
