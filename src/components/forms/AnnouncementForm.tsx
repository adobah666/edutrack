"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { announcementSchema, AnnouncementSchema } from "@/lib/formValidationSchemas";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Class, Teacher } from "@prisma/client";

// Create new server actions specifically for fetching related data
import { getClasses, getTeachers } from "@/lib/actions";

const AnnouncementForm = ({
  type,
  data,
  setOpen,
  relatedData: initialRelatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    classes?: Class[];
    teachers?: Teacher[];
  };
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [relatedData, setRelatedData] = useState(initialRelatedData || {});
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch classes and teachers using server actions
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch both classes and teachers using the server actions
        const [classesData, teachersData] = await Promise.all([
          getClasses(),
          getTeachers()
        ]);

        setRelatedData({
          classes: classesData.success ? classesData.data : [],
          teachers: teachersData.success ? teachersData.data : []
        });

        if (!classesData.success) {
          console.error("Failed to fetch classes:", classesData.error);
          setFetchError(prev => prev || `Classes fetch failed: ${classesData.error}`);
        }

        if (!teachersData.success) {
          console.error("Failed to fetch teachers:", teachersData.error);
          setFetchError(prev => prev || `Teachers fetch failed: ${teachersData.error}`);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setFetchError(`Network error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we don't already have the data
    if (!relatedData.classes || !relatedData.teachers) {
      fetchData();
    }
  }, [relatedData.classes, relatedData.teachers]);

  // Make sure classes and teachers are arrays, even if undefined
  const classes = Array.isArray(relatedData?.classes) ? relatedData.classes : [];
  const teachers = Array.isArray(relatedData?.teachers) ? relatedData.teachers : [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
    defaultValues: data
      ? {
        ...data,
        date: data.date ? new Date(data.date).toISOString().split("T")[0] : undefined,
      }
      : undefined,
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAnnouncement : updateAnnouncement,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  useEffect(() => {
    if (state.success) {
      toast(`Announcement has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <h1 className="text-xl font-semibold">
          {type === "create" ? "Create a new announcement" : "Update the announcement"}
        </h1>
        <div className="flex justify-center items-center p-8">
          <p>Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new announcement" : "Update the announcement"}
      </h1>

      {fetchError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error loading data: {fetchError}</p>
        </div>
      )}

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
          className="w-full md:w-1/2"
        />

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

        {/* Description field (replacing content field) */}
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Description</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full h-32"
            {...register("description")}
            defaultValue={data?.description}
          />
          {errors.description?.message && (
            <p className="text-xs text-red-400">
              {errors.description.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Date</label>
          <input
            type="date"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("date")}
            defaultValue={data?.date ? new Date(data.date).toISOString().split("T")[0] : undefined}
          />
          {errors.date?.message && (
            <p className="text-xs text-red-400">
              {errors.date.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Priority</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("priority")}
            defaultValue={data?.priority || ""}
          >
            <option value="">Select Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          {errors.priority?.message && (
            <p className="text-xs text-red-400">
              {errors.priority.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Author</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("teacherId")}
            defaultValue={data?.teacherId || ""}
          >
            <option value="">Select Author</option>
            {teachers && teachers.length > 0 ? (
              teachers.map((teacher) => (
                <option
                  value={teacher.id}
                  key={teacher.id}
                >
                  {teacher.name} {teacher.surname}
                </option>
              ))
            ) : (
              <option value="" disabled>No teachers available</option>
            )}
          </select>
          {errors.teacherId?.message && (
            <p className="text-xs text-red-400">
              {errors.teacherId.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Class (Optional)</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("classId")}
            defaultValue={data?.classId || ""}
          >
            <option value="">All Classes</option>
            {classes && classes.length > 0 ? (
              classes.map((classItem) => (
                <option
                  value={String(classItem.id)}
                  key={classItem.id}
                >
                  {classItem.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                {isLoading ? "Loading classes..." : "No classes available"}
              </option>
            )}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">
              {errors.classId.message.toString()}
            </p>
          )}
        </div>

        {/* SMS Notification Option */}
        <div className="flex items-center gap-2 w-full">
          <input
            type="checkbox"
            id="sendSMS"
            {...register("sendSMS")}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="sendSMS" className="text-sm text-gray-700">
            Send SMS notification to students and parents
          </label>
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

export default AnnouncementForm;