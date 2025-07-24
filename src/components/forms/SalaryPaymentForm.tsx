"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createSalaryPayment, updateSalaryPayment } from "@/lib/actions";

const schema = z.object({
  id: z.coerce.number().optional(),
  salaryId: z.coerce.number().min(1, { message: "Salary ID is required!" }),
  amount: z.coerce.number().min(0, { message: "Amount must be positive!" }),
  payPeriodStart: z.string().min(1, { message: "Pay period start is required!" }),
  payPeriodEnd: z.string().min(1, { message: "Pay period end is required!" }),
  dueDate: z.string().min(1, { message: "Due date is required!" }),
  payDate: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE"], {
    message: "Status is required!",
  }),
  notes: z.string().optional(),
});

type Inputs = z.infer<typeof schema>;

const SalaryPaymentForm = ({
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
      payPeriodStart: data?.payPeriodStart ? new Date(data.payPeriodStart).toISOString().split('T')[0] : "",
      payPeriodEnd: data?.payPeriodEnd ? new Date(data.payPeriodEnd).toISOString().split('T')[0] : "",
      dueDate: data?.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : "",
      payDate: data?.payDate ? new Date(data.payDate).toISOString().split('T')[0] : "",
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createSalaryPayment : updateSalaryPayment,
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
      toast(`Salary payment has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const watchedStatus = watch("status");

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new salary payment" : "Update salary payment"}
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

        <InputField
          label="Pay Period Start"
          name="payPeriodStart"
          defaultValue={data?.payPeriodStart ? new Date(data.payPeriodStart).toISOString().split('T')[0] : ""}
          register={register}
          error={errors?.payPeriodStart}
          type="date"
        />

        <InputField
          label="Pay Period End"
          name="payPeriodEnd"
          defaultValue={data?.payPeriodEnd ? new Date(data.payPeriodEnd).toISOString().split('T')[0] : ""}
          register={register}
          error={errors?.payPeriodEnd}
          type="date"
        />

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
          <label className="text-xs text-gray-500">Notes (Optional)</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("notes")}
            rows={3}
            placeholder="Add any notes about this payment..."
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

export default SalaryPaymentForm;