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
  const [adminPassword, setAdminPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);

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
    if (!showPasswordField) {
      setShowPasswordField(true);
      return;
    }

    if (!adminPassword.trim()) {
      toast.error("Admin password is required to record payment");
      return;
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    formData.append("adminPassword", adminPassword);
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

        {showPasswordField && (
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">Admin Password</label>
            <input
              type="password"
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter your admin account password"
              required
            />
            <p className="text-xs text-red-500">
              ⚠️ Enter your admin account password to verify this action
            </p>
          </div>
        )}
      </div>

      {showPasswordField && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-yellow-800 font-medium">Security Verification Required</span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            This action requires admin password verification to prevent accidental payment recording.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        {showPasswordField && (
          <button
            type="button"
            onClick={() => {
              setShowPasswordField(false);
              setAdminPassword("");
            }}
            className="bg-gray-400 text-white p-2 rounded-md flex-1"
          >
            Cancel
          </button>
        )}
        <button 
          type="submit"
          className="bg-blue-400 text-white p-2 rounded-md flex-1"
        >
          {showPasswordField ? "Verify & Record Payment" : "Record Payment"}
        </button>
      </div>
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
