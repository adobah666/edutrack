"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import FormModal from "../FormModal";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";

// Define the schema
const classFeeSchema = z.object({
  id: z.coerce.number().optional(),
  amount: z.coerce.number().min(0, { message: "Amount must be positive!" }),
  dueDate: z.string().min(1, { message: "Due date is required!" }),
  classId: z.coerce.number().optional(),
  feeTypeId: z.coerce.number().min(1, { message: "Fee type is required!" }),
  feeScope: z.enum(["CLASS_WIDE", "INDIVIDUAL"]).default("CLASS_WIDE"),
  description: z.string().optional(),
  selectedStudents: z.array(z.string()).optional(),
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
  const [feeTypes, setFeeTypes] = useState(relatedData?.feeTypes || []);
  const [feeScope, setFeeScope] = useState<"CLASS_WIDE" | "INDIVIDUAL">("CLASS_WIDE");
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ClassFeeSchema>({
    resolver: zodResolver(classFeeSchema),
  });

  const watchedFeeScope = watch("feeScope", "CLASS_WIDE");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch students when fee scope changes or class changes
  const fetchStudents = async (classId?: string) => {
    try {
      const url = classId && classId !== "all" 
        ? `/api/students-for-fees?classId=${classId}`
        : "/api/students-for-fees";
      
      const response = await fetch(url);
      if (response.ok) {
        const students = await response.json();
        setAvailableStudents(students);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    try {
      // Validation for individual fees
      if (formData.feeScope === "INDIVIDUAL" && selectedStudents.length === 0) {
        toast.error("Please select at least one student for individual fee");
        setIsSubmitting(false);
        return;
      }

      // Validation for class-wide fees
      if (formData.feeScope === "CLASS_WIDE" && !formData.classId) {
        toast.error("Please select a class for class-wide fee");
        setIsSubmitting(false);
        return;
      }

      const url = type === "create" ? "/api/class-fees" : `/api/class-fees/${data?.id}`;
      const method = type === "create" ? "POST" : "PUT";

      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && key !== "selectedStudents") {
          submitData.append(key, value.toString());
        }
      });

      // Add selected students for individual fees
      if (formData.feeScope === "INDIVIDUAL") {
        submitData.append("selectedStudents", JSON.stringify(selectedStudents));
      }

      const response = await fetch(url, {
        method,
        body: submitData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success(`Fee ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  });

  const router = useRouter();

  // Initialize fee types from relatedData and keep them updated
  useEffect(() => {
    if (relatedData?.feeTypes) {
      setFeeTypes(relatedData.feeTypes);
    }
  }, [relatedData?.feeTypes]);

  // Watch for fee scope changes
  useEffect(() => {
    setFeeScope(watchedFeeScope);
    if (watchedFeeScope === "INDIVIDUAL") {
      fetchStudents(selectedClass || "all");
    }
  }, [watchedFeeScope, selectedClass]);

  // Handle class selection change
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setValue("classId", classId ? parseInt(classId) : undefined);
    if (feeScope === "INDIVIDUAL") {
      fetchStudents(classId);
      setSelectedStudents([]); // Reset selected students when class changes
    }
  };

  // Handle student selection
  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const { classes } = relatedData || { classes: [] };

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create Class Fee" : "Update Class Fee"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        {/* Fee Scope Selection */}
        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Fee Scope</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("feeScope")}
            defaultValue={data?.feeScope || "CLASS_WIDE"}
          >
            <option value="CLASS_WIDE">Class-wide Fee</option>
            <option value="INDIVIDUAL">Individual/Group Fee</option>
          </select>
        </div>

        {/* Class Selection - Required for class-wide, optional filter for individual */}
        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">
            {feeScope === "CLASS_WIDE" ? "Class" : "Filter by Class (Optional)"}
          </label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
          >
            <option value="">
              {feeScope === "CLASS_WIDE" ? "Select Class" : "All Classes"}
            </option>
            {classes.map((classItem: { id: number; name: string }) => (
              <option value={classItem.id.toString()} key={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
          {feeScope === "CLASS_WIDE" && !selectedClass && (
            <p className="text-xs text-red-400">Class is required for class-wide fees</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-500">Fee Type</label>
            <button
              type="button"
              onClick={() => {
                // Find and click the existing "Add Fee Type" button
                const addFeeTypeButton = document.querySelector('button span')?.textContent === 'Add Fee Type' 
                  ? document.querySelector('button span')?.parentElement as HTMLButtonElement
                  : Array.from(document.querySelectorAll('button')).find(btn => 
                      btn.textContent?.includes('Add Fee Type')
                    ) as HTMLButtonElement;
                
                if (addFeeTypeButton) {
                  addFeeTypeButton.click();
                }
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-transparent border-none p-0 cursor-pointer"
            >
              + New Fee Type
            </button>
          </div>
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
      </div>

      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/3">
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

        <div className="flex flex-col gap-2 w-full md:w-1/3">
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

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Description (Optional)</label>
          <input
            type="text"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("description")}
            defaultValue={data?.description || ""}
            placeholder="e.g., New student admission fee"
          />
        </div>
      </div>

      {/* Student Selection for Individual Fees */}
      {feeScope === "INDIVIDUAL" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Select Students ({selectedStudents.length} selected)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedStudents(availableStudents.map(s => s.id))}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudents([])}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
            {availableStudents.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No students found. {selectedClass ? "Try selecting a different class." : ""}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableStudents.map((student) => (
                  <label
                    key={student.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      className="rounded"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {student.name} {student.surname}
                      </span>
                      <span className="text-xs text-gray-500">
                        {student.class.name} • {student.username}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          {selectedStudents.length === 0 && (
            <p className="text-xs text-red-400">
              Please select at least one student for individual fee
            </p>
          )}
        </div>
      )}

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

      <button 
        className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Processing..." : (type === "create" ? "Create" : "Update")}
      </button>
    </form>
  );
};

export default ClassFeeForm;
