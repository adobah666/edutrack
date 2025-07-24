"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createAccount, updateAccount } from "@/lib/actions";

const schema = z.object({
  id: z.coerce.number().optional(),
  code: z.string().min(1, { message: "Account code is required!" }),
  name: z.string().min(1, { message: "Account name is required!" }),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"], {
    message: "Account type is required!",
  }),
  subType: z.enum([
    "CURRENT_ASSET", "FIXED_ASSET",
    "CURRENT_LIABILITY", "LONG_TERM_LIABILITY", 
    "OWNERS_EQUITY", "RETAINED_EARNINGS",
    "OPERATING_INCOME", "NON_OPERATING_INCOME",
    "OPERATING_EXPENSE", "NON_OPERATING_EXPENSE"
  ], {
    message: "Account sub-type is required!",
  }),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

type Inputs = z.infer<typeof schema>;

const AccountForm = ({
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
    defaultValues: data,
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAccount : updateAccount,
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
      toast(`Account has been ${type === "create" ? "created" : "updated"}!`);
      if (setOpen) {
        setOpen(false);
      }
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const watchedType = watch("type");

  const getSubTypeOptions = (accountType: string) => {
    switch (accountType) {
      case "ASSET":
        return [
          { value: "CURRENT_ASSET", label: "Current Asset" },
          { value: "FIXED_ASSET", label: "Fixed Asset" },
        ];
      case "LIABILITY":
        return [
          { value: "CURRENT_LIABILITY", label: "Current Liability" },
          { value: "LONG_TERM_LIABILITY", label: "Long-term Liability" },
        ];
      case "EQUITY":
        return [
          { value: "OWNERS_EQUITY", label: "Owner's Equity" },
          { value: "RETAINED_EARNINGS", label: "Retained Earnings" },
        ];
      case "INCOME":
        return [
          { value: "OPERATING_INCOME", label: "Operating Income" },
          { value: "NON_OPERATING_INCOME", label: "Non-operating Income" },
        ];
      case "EXPENSE":
        return [
          { value: "OPERATING_EXPENSE", label: "Operating Expense" },
          { value: "NON_OPERATING_EXPENSE", label: "Non-operating Expense" },
        ];
      default:
        return [];
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new account" : "Update account"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Account Code"
          name="code"
          defaultValue={data?.code}
          register={register}
          error={errors?.code}
          inputProps={{ placeholder: "e.g., 1001, 2001" }}
        />

        <InputField
          label="Account Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
          inputProps={{ placeholder: "e.g., Cash, Accounts Payable" }}
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Account Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("type")}
          >
            <option value="">Select account type</option>
            <option value="ASSET">Asset</option>
            <option value="LIABILITY">Liability</option>
            <option value="EQUITY">Equity</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          {errors.type?.message && (
            <p className="text-xs text-red-400">{errors.type.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sub Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("subType")}
            disabled={!watchedType}
          >
            <option value="">Select sub-type</option>
            {getSubTypeOptions(watchedType).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.subType?.message && (
            <p className="text-xs text-red-400">{errors.subType.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Description (Optional)</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("description")}
            rows={3}
            placeholder="Brief description of this account..."
          />
          {errors.description?.message && (
            <p className="text-xs text-red-400">{errors.description.message.toString()}</p>
          )}
        </div>

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

export default AccountForm;