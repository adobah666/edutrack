"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createTransaction, updateTransaction } from "@/lib/actions";

const schema = z.object({
  id: z.coerce.number().optional(),
  reference: z.string().min(1, { message: "Reference is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  amount: z.coerce.number().min(0.01, { message: "Amount must be greater than 0!" }),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"], {
    message: "Transaction type is required!",
  }),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "MOBILE_MONEY", "CARD", "OTHER"], {
    message: "Payment method is required!",
  }),
  accountId: z.coerce.number().min(1, { message: "Account is required!" }),
  date: z.string().min(1, { message: "Date is required!" }),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

type Inputs = z.infer<typeof schema>;

const TransactionForm = ({
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
    watch,
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...data,
      date: data?.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createTransaction : updateTransaction,
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
      toast(`Transaction has been ${type === "create" ? "created" : "updated"}!`);
      if (setOpen) {
        setOpen(false);
      }
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const watchedType = watch("type");
  const { accounts } = relatedData || {};

  // Filter accounts based on transaction type
  const getFilteredAccounts = () => {
    if (!accounts) return [];
    
    switch (watchedType) {
      case "INCOME":
        return accounts.filter((acc: any) => acc.type === "INCOME" || acc.type === "ASSET");
      case "EXPENSE":
        return accounts.filter((acc: any) => acc.type === "EXPENSE" || acc.type === "ASSET");
      default:
        return accounts;
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new transaction" : "Update transaction"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Reference Number"
          name="reference"
          defaultValue={data?.reference}
          register={register}
          error={errors?.reference}
          inputProps={{ placeholder: "e.g., TXN-001, INV-2025-001" }}
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Transaction Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("type")}
          >
            <option value="">Select type</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="TRANSFER">Transfer</option>
          </select>
          {errors.type?.message && (
            <p className="text-xs text-red-400">{errors.type.message.toString()}</p>
          )}
        </div>

        <InputField
          label="Amount (GHS)"
          name="amount"
          defaultValue={data?.amount}
          register={register}
          error={errors?.amount}
          type="number"
          inputProps={{ step: "0.01", min: "0.01" }}
        />

        <InputField
          label="Date"
          name="date"
          defaultValue={data?.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
          register={register}
          error={errors?.date}
          type="date"
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Account</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("accountId")}
          >
            <option value="">Select account</option>
            {getFilteredAccounts().map((account: any) => (
              <option key={account.id} value={account.id}>
                {account.code} - {account.name}
              </option>
            ))}
          </select>
          {errors.accountId?.message && (
            <p className="text-xs text-red-400">{errors.accountId.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Payment Method</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("paymentMethod")}
          >
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </select>
          {errors.paymentMethod?.message && (
            <p className="text-xs text-red-400">{errors.paymentMethod.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Description</label>
          <input
            type="text"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("description")}
            placeholder="Brief description of the transaction..."
          />
          {errors.description?.message && (
            <p className="text-xs text-red-400">{errors.description.message.toString()}</p>
          )}
        </div>

        <InputField
          label="Receipt/Invoice Number (Optional)"
          name="receiptNumber"
          defaultValue={data?.receiptNumber}
          register={register}
          error={errors?.receiptNumber}
          inputProps={{ placeholder: "Receipt or invoice number" }}
        />

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Notes (Optional)</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("notes")}
            rows={3}
            placeholder="Additional notes about this transaction..."
          />
          {errors.notes?.message && (
            <p className="text-xs text-red-400">{errors.notes.message.toString()}</p>
          )}
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

export default TransactionForm;