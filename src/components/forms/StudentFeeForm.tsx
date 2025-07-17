"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { z } from "zod";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import ReceiptModal from "../ReceiptModal";

// Define the schema
const studentFeeSchema = z.object({
  id: z.coerce.number().optional(),
  amount: z.coerce.number().min(0, { message: "Amount must be positive!" }),
  studentId: z.string().min(1, { message: "Student is required!" }),
  classFeeId: z.coerce.number().min(1, { message: "Class fee is required!" }),
});

type StudentFeeSchema = z.infer<typeof studentFeeSchema>;

const StudentFeeForm = ({
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
  } = useForm<StudentFeeSchema>({
    resolver: zodResolver(studentFeeSchema),
    defaultValues: {
      studentId: data?.studentId,
      classFeeId: data?.classFeeId,
      amount: data?.remainingAmount,
    }
  });

  const [paymentData, setPaymentData] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const [state, formAction] = useFormState(
    async (prevState: any, formData: FormData) => {
      try {
        const url = type === "create" ? "/api/student-fees" : `/api/student-fees/${data?.id}`;
        const method = type === "create" ? "POST" : "PUT";

        const response = await fetch(url, {
          method,
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          return { ...prevState, error: true, message: error.message };
        }

        const payment = await response.json();
        return { ...prevState, success: true, payment };
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
      toast.success("Payment recorded successfully!");
      if (state.payment) {
        setPaymentData(state.payment);
        setShowReceipt(true);
      }
      // router.refresh();
    } else if (state.error) {
      toast.error(state.message || "Something went wrong!");
    }
  }, [state, router, type]);
  return (
    <>
      <form className="flex flex-col gap-8" onSubmit={onSubmit}>
        <h1 className="text-xl font-semibold">Record Payment</h1>

      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Amount to Pay</label>
          <input
            type="number"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("amount")}
            defaultValue={data?.remainingAmount}
            min={0}
            max={data?.remainingAmount}
            step={0.01}
          />
          {errors.amount?.message && (
            <p className="text-xs text-red-400">
              {errors.amount.message.toString()}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Maximum amount: GH₵{data?.remainingAmount?.toFixed(2)}
          </p>
        </div>

        <input type="hidden" {...register("studentId")} />
        <input type="hidden" {...register("classFeeId")} />

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
      </div>      <button className="bg-blue-400 text-white p-2 rounded-md">
        Record Payment
      </button>
    </form>

    {showReceipt && paymentData && (
      <ReceiptModal 
        payment={paymentData} 
        onClose={() => {
          setShowReceipt(false);
          setOpen(false);
          router.refresh();
        }} 
      />
    )}
    </>
  );
};

export default StudentFeeForm;
