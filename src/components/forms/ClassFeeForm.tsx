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
const classFeeSchema = z.object({
  id: z.coerce.number().optional(),
  amount: z.coerce.number().min(0, { message: "Amount must be positive!" }),
  dueDate: z.string().min(1, { message: "Due date is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  feeTypeId: z.coerce.number().min(1, { message: "Fee type is required!" }),
});

type ClassFeeSchema = z.infer<typeof classFeeSchema>;

const ClassFeeForm = ({
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
  } = useForm<ClassFeeSchema>({
    resolver: zodResolver(classFeeSchema),
  });

  const [state, formAction] = useFormState(
    async (prevState: any, formData: FormData) => {
      try {
        const url = type === "create" ? "/api/class-fees" : `/api/class-fees/${data?.id}`;
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
      toast.success(`Class fee ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error(state.message || "Something went wrong!");
    }
  }, [state, router, type, setOpen]);

  const { classes, feeTypes } = relatedData || { classes: [], feeTypes: [] };

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create Class Fee" : "Update Class Fee"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Class</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("classId")}
            defaultValue={data?.classId || ""}
          >
            <option value="">Select Class</option>
            {classes.map((classItem: { id: number; name: string }) => (
              <option value={classItem.id} key={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">
              {errors.classId.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Fee Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("feeTypeId")}
            defaultValue={data?.feeTypeId || ""}
          >
            <option value="">Select Fee Type</option>
            {feeTypes.map((feeType: { id: number; name: string }) => (
              <option value={feeType.id} key={feeType.id}>
                {feeType.name}
              </option>
            ))}
          </select>
          {errors.feeTypeId?.message && (
            <p className="text-xs text-red-400">
              {errors.feeTypeId.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Amount</label>
          <input
            type="number"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("amount")}
            defaultValue={data?.amount || 0}
            min={0}
            step={0.01}
          />
          {errors.amount?.message && (
            <p className="text-xs text-red-400">
              {errors.amount.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Due Date</label>
          <input
            type="date"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("dueDate")}
            defaultValue={data?.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : undefined}
          />
          {errors.dueDate?.message && (
            <p className="text-xs text-red-400">
              {errors.dueDate.message.toString()}
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

export default ClassFeeForm;
