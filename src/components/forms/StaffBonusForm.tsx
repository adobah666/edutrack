"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createStaffBonus, updateStaffBonus } from "@/lib/actions";

const schema = z.object({
  id: z.coerce.number().optional(),
  salaryId: z.coerce.number().min(1, { message: "Salary ID is required!" }),
  amount: z.coerce.number().min(0, { message: "Amount must be positive!" }),
  reason: z.string().min(1, { message: "Reason is required!" }),
  bonusType: z.enum(["PERFORMANCE", "HOLIDAY", "ANNUAL", "PROJECT", "OVERTIME", "OTHER"], {
    message: "Bonus type is required!",
  }),
  dueDate: z.string().min(1, { message: "Due date is required!" }),
  payDate: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE"], {
    message: "Status is required!",
  }),
  notes: z.string().optional(),
});

type Inputs = z.infer<typeof schema>;

const StaffBonusForm = ({
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
    formState: { errors },
    watch,
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...data,
      salaryId: data?.salaryId || relatedData?.salaryId,
      dueDate: data?.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : "",
      payDate: data?.payDate ? new Date(data.payDate).toISOString().split('T')[0] : "",
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createStaffBonus : updateStaffBonus,
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
      toast(`Staff bonus has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const watchedStatus = watch("status");

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new staff bonus" : "Update staff bonus"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Amount"
          name="amount"
          defaultValue={data?.amount}
          register={register}
          error={errors?.amount}
          type="number"
          inputProps={{ step: "0.01" }}
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Bonus Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("bonusType")}
          >
            <option value="PERFORMANCE">Performance</option>
            <option value="HOLIDAY">Holiday</option>
            <option value="ANNUAL">Annual</option>
            <option value="PROJECT">Project</option>
            <option value="OVERTIME">Overtime</option>
            <option value="OTHER">Other</option>
          </select>
          {errors.bonusType?.message && (
            <p className="text-xs text-red-400">{errors.bonusType.message.toString()}</p>
          )}
        </div>

        <InputField
          label="Due Date"
          name="dueDate"
          defaultValue={data?.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : ""}
          register={register}
          error={errors?.dueDate}
          type="date"
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Status</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("status")}
          >
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          {errors.status?.message && (
            <p className="text-xs text-red-400">{errors.status.message.toString()}</p>
          )}
        </div>

        {watchedStatus === "PAID" && (
          <InputField
            label="Pay Date"
            name="payDate"
            defaultValue={data?.payDate ? new Date(data.payDate).toISOString().split('T')[0] : ""}
            register={register}
            error={errors?.payDate}
            type="date"
          />
        )}

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Reason</label>
          <input
            type="text"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("reason")}
            placeholder="e.g., Excellent performance in Q4"
          />
          {errors.reason?.message && (
            <p className="text-xs text-red-400">{errors.reason.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Notes (Optional)</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("notes")}
            rows={3}
            placeholder="Add any additional notes about this bonus..."
          />
          {errors.notes?.message && (
            <p className="text-xs text-red-400">{errors.notes.message.toString()}</p>
          )}
        </div>
      </div>

      {/* Hidden field for salaryId */}
      <input type="hidden" {...register("salaryId")} />

      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default StaffBonusForm;