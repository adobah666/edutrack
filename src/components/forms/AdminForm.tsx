"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { createAdmin, updateAdmin } from "@/lib/school-actions";
import { useFormState } from "react-dom";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const schema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, { message: "Username must be at least 3 characters long!" }),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z.string().email({ message: "Invalid email address!" }).optional().or(z.literal("")),
  password: z.string().min(8, { message: "Password must be at least 8 characters long!" }),
  role: z.enum(["SUPER_ADMIN", "SCHOOL_ADMIN"], {
    message: "Role is required!",
  }),
  schoolId: z.string().optional(),
});

type AdminSchema = z.infer<typeof schema>;

const AdminForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: (open: boolean) => void;
  relatedData?: { schools: { id: string; name: string }[] };
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AdminSchema>({
    resolver: zodResolver(schema),
    defaultValues: data,
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAdmin : updateAdmin,
    {
      success: false,
      error: false,
      message: "",
    }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Admin has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const selectedRole = watch("role");

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new admin" : "Update admin"}
      </h1>

      {state.error && (
        <span className="text-red-500">
          {state.message || "Something went wrong!"}
        </span>
      )}

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="First Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Last Name"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors?.surname}
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        {type === "create" && (
          <InputField
            label="Password"
            name="password"
            type="password"
            register={register}
            error={errors?.password}
          />
        )}
        
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Role</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("role")}
            defaultValue={data?.role}
          >
            <option value="">Select a role</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="SCHOOL_ADMIN">School Admin</option>
          </select>
          {errors.role?.message && (
            <p className="text-xs text-red-400">{errors.role.message.toString()}</p>
          )}
        </div>

        {selectedRole === "SCHOOL_ADMIN" && relatedData?.schools && (
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">School</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("schoolId")}
              defaultValue={data?.schoolId}
            >
              <option value="">Select a school</option>
              {relatedData.schools.map((school: { id: string; name: string }) => (
                <option value={school.id} key={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
            {errors.schoolId?.message && (
              <p className="text-xs text-red-400">{errors.schoolId.message.toString()}</p>
            )}
          </div>
        )}
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

export default AdminForm;