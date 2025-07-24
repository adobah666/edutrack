"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createStaffSalary, updateStaffSalary } from "@/lib/actions";

const schema = z.object({
  id: z.coerce.number().optional(),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
  baseSalary: z.coerce.number().min(0, { message: "Base salary must be positive!" }),
  currency: z.string().min(1, { message: "Currency is required!" }),
  payFrequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY"], {
    message: "Pay frequency is required!",
  }),
  startDate: z.string().min(1, { message: "Start date is required!" }),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

type Inputs = z.infer<typeof schema>;

const StaffSalaryForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...data,
      startDate: data?.startDate ? new Date(data.startDate).toISOString().split('T')[0] : "",
      endDate: data?.endDate ? new Date(data.endDate).toISOString().split('T')[0] : "",
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createStaffSalary : updateStaffSalary,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Staff salary has been ${type === "create" ? "created" : "updated"}!`);
      if (setOpen) {
        setOpen(false);
      }
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { teachers } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new staff salary" : "Update staff salary"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Teacher</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("teacherId")}
            disabled={type === "update"}
          >
            <option value="">Select a teacher</option>
            {teachers?.map((teacher: { id: string; name: string; surname: string }) => (
              <option value={teacher.id} key={teacher.id}>
                {teacher.name} {teacher.surname}
              </option>
            ))}
          </select>
          {errors.teacherId?.message && (
            <p className="text-xs text-red-400">{errors.teacherId.message.toString()}</p>
          )}
        </div>

        <InputField
          label="Base Salary"
          name="baseSalary"
          defaultValue={data?.baseSalary}
          register={register}
          error={errors?.baseSalary}
          type="number"
          inputProps={{ step: "0.01" }}
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Currency</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("currency")}
            defaultValue="GHS"
          >
            <option value="GHS">GHS (Ghana Cedis)</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="NGN">NGN</option>
            <option value="KES">KES</option>
            <option value="ZAR">ZAR</option>
          </select>
          {errors.currency?.message && (
            <p className="text-xs text-red-400">{errors.currency.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Pay Frequency</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("payFrequency")}
          >
            <option value="WEEKLY">Weekly</option>
            <option value="BIWEEKLY">Bi-weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="ANNUALLY">Annually</option>
          </select>
          {errors.payFrequency?.message && (
            <p className="text-xs text-red-400">{errors.payFrequency.message.toString()}</p>
          )}
        </div>

        <InputField
          label="Start Date"
          name="startDate"
          defaultValue={data?.startDate ? new Date(data.startDate).toISOString().split('T')[0] : ""}
          register={register}
          error={errors?.startDate}
          type="date"
        />

        <InputField
          label="End Date (Optional)"
          name="endDate"
          defaultValue={data?.endDate ? new Date(data.endDate).toISOString().split('T')[0] : ""}
          register={register}
          error={errors?.endDate}
          type="date"
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Status</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("isActive")}
              defaultChecked={data?.isActive !== false}
              className="w-4 h-4"
            />
            <span className="text-sm">Active</span>
          </div>
        </div>
      </div>

      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default StaffSalaryForm;