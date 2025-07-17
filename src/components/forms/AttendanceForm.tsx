"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { z } from "zod";
import { Class, Student } from "@prisma/client";
import { createAttendance, updateAttendance } from "@/lib/actions";

// Define the attendance schema
const attendanceSchema = z.object({
  id: z.coerce.number().optional(),
  date: z.coerce.date({ message: "Date is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  students: z.array(z.object({
    id: z.string(),
    isPresent: z.boolean()
  }))
});

export type AttendanceSchema = z.infer<typeof attendanceSchema>;

interface AttendanceFormProps {
  type: string;
  data?: any;
  setOpen: (open: boolean) => void;
  relatedData: {
    classes: Class[];
    students: Student[];
  };
}

const AttendanceForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: AttendanceFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<AttendanceSchema>({
    resolver: zodResolver(attendanceSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAttendance : updateAttendance,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();
  const selectedClassId = watch("classId");
  const watchedStudents = watch("students");

  useEffect(() => {
    if (state.success) {
      toast(`Attendance has been ${type === "create" ? "recorded" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { classes = [], students = [] } = relatedData || {};
  
  // Filter students by selected class
  const classStudents = selectedClassId 
    ? students.filter(student => student.classId === parseInt(selectedClassId.toString()))
    : [];

  // Set up student attendance records when class changes
  useEffect(() => {
    if (classStudents.length > 0) {
      // Only set initial values if students array is not already populated
      const currentStudents = getValues("students");
      if (!currentStudents || currentStudents.length !== classStudents.length) {
        setValue(
          "students",
          classStudents.map(student => ({
            id: student.id,
            isPresent: false // Default to false (absent) to avoid confusion
          }))
        );
      }
    }
  }, [selectedClassId, setValue, classStudents, getValues]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const formData = {
        ...data,
        date: new Date(data.date)
      };
      
      await formAction(formData);
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error("Failed to save attendance");
    }
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Record Daily Attendance" : "Update Daily Attendance"}
      </h1>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Date</label>
          <input
            type="date"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
            {...register("date")}
            defaultValue={data?.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
          />
          {errors.date?.message && (
            <p className="text-xs text-red-400">{errors.date.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Class</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
            {...register("classId")}
            defaultValue={data?.classId || ""}
          >
            <option value="">Select Class</option>
            {classes.map((class_) => (
              <option key={class_.id} value={class_.id}>
                {class_.name}
              </option>
            ))}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">{errors.classId.message}</p>
          )}
        </div>

        {selectedClassId && classStudents.length > 0 && watchedStudents && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-3">Mark Attendance</h3>
            <div className="flex items-center gap-4 mb-4 p-3 bg-gray-100 rounded">
              <button
                type="button"
                onClick={() => {
                  classStudents.forEach((_, index) => {
                    setValue(`students.${index}.isPresent`, true);
                  });
                }}
                className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                <span className="text-sm font-medium">Mark all Present</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  classStudents.forEach((_, index) => {
                    setValue(`students.${index}.isPresent`, false);
                  });
                }}
                className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                <span className="text-sm font-medium">Mark all Absent</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  classStudents.forEach((_, index) => {
                    setValue(`students.${index}.isPresent`, false);
                  });
                }}
                className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                <span className="text-sm font-medium">Uncheck All</span>
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classStudents.map((student, index) => (
                <div key={student.id} className="flex flex-col p-3 bg-gray-50 rounded">
                  <div className="text-sm font-medium mb-2">{student.name} {student.surname}</div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`student-${student.id}`}
                        checked={watchedStudents[index]?.isPresent === true}
                        onChange={() => setValue(`students.${index}.isPresent`, true)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-green-600">Present</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`student-${student.id}`}
                        checked={watchedStudents[index]?.isPresent === false}
                        onChange={() => setValue(`students.${index}.isPresent`, false)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-red-600">Absent</span>
                    </label>
                  </div>
                  <input 
                    type="hidden" 
                    {...register(`students.${index}.id`)}
                    value={student.id}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      
      <button 
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
      >
        {type === "create" ? "Save Attendance" : "Update Attendance"}
      </button>
    </form>
  );
};

export default AttendanceForm;