"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { eventSchema, EventSchema } from "@/lib/formValidationSchemas";
import { createEvent, updateEvent } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const EventForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    classes: { id: number; name: string }[];
  };
}) => {
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [allClassesSelected, setAllClassesSelected] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: data
      ? {
          ...data,
          startTime: data.startTime ? new Date(data.startTime) : undefined,
          endTime: data.endTime ? new Date(data.endTime) : undefined,
        }
      : undefined,
  });

  const [state, formAction] = useFormState(
    type === "create" ? createEvent : updateEvent,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    const formData = {
      ...data,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      classIds: selectedClasses,
      allClasses: allClassesSelected,
    };
    console.log(formData);
    formAction(formData);
  });

  const router = useRouter();
  const { classes } = relatedData || { classes: [] };

  useEffect(() => {
    if (state.success) {
      toast(`Event has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new event" : "Update the event"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <div className="w-full">
          <InputField
            label="Event title"
            name="title"
            defaultValue={data?.title}
            register={register}
            error={errors?.title}
          />
        </div>

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

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Target Classes</label>
          
          {/* All Classes Option */}
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
            <input
              type="checkbox"
              id="allClasses"
              checked={allClassesSelected}
              onChange={(e) => {
                setAllClassesSelected(e.target.checked);
                if (e.target.checked) {
                  setSelectedClasses([]);
                }
              }}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="allClasses" className="text-sm font-medium text-blue-800">
              📢 All Classes (School-wide Event)
            </label>
          </div>

          {/* Individual Class Selection */}
          {!allClassesSelected && (
            <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
              <p className="text-xs text-gray-500 mb-2">Select specific classes:</p>
              {classes?.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {classes.map((classItem) => (
                    <div key={classItem.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`class-${classItem.id}`}
                        checked={selectedClasses.includes(classItem.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClasses([...selectedClasses, classItem.id]);
                          } else {
                            setSelectedClasses(selectedClasses.filter(id => id !== classItem.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <label htmlFor={`class-${classItem.id}`} className="text-sm">
                        {classItem.name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No classes available</p>
              )}
            </div>
          )}

          {/* Selection Summary */}
          <div className="text-xs text-gray-600">
            {allClassesSelected ? (
              <span className="text-blue-600 font-medium">✓ Event will be visible to all classes</span>
            ) : selectedClasses.length > 0 ? (
              <span className="text-green-600 font-medium">
                ✓ Selected {selectedClasses.length} class{selectedClasses.length !== 1 ? 'es' : ''}
              </span>
            ) : (
              <span className="text-orange-600">⚠ No classes selected - event will be school-wide</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Start Date & Time</label>
          <input
            type="datetime-local"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("startTime")}
            defaultValue={
              data?.startTime
                ? new Date(data.startTime).toISOString().slice(0, 16)
                : undefined
            }
          />
          {errors.startTime?.message && (
            <p className="text-xs text-red-400">
              {errors.startTime.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">End Date & Time</label>
          <input
            type="datetime-local"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("endTime")}
            defaultValue={
              data?.endTime
                ? new Date(data.endTime).toISOString().slice(0, 16)
                : undefined
            }
          />
          {errors.endTime?.message && (
            <p className="text-xs text-red-400">
              {errors.endTime.message.toString()}
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

export default EventForm;