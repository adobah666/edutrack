"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { lessonSchema, LessonSchema } from "@/lib/formValidationSchemas";
import { createLesson, updateLesson } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const LessonForm = ({
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
  // Extract relatedData first
  const { subjects = [], classes = [], teachers = [], schoolHours = { openingTime: "08:00", closingTime: "17:00" } } = relatedData || {};

  const [selectedSubjectId, setSelectedSubjectId] = useState(data?.subjectId || "");
  const [selectedClassId, setSelectedClassId] = useState(data?.classId || "");
  const [startTime, setStartTime] = useState(data?.startTime || "09:00");
  const [endTime, setEndTime] = useState(data?.endTime || "10:00");
  const [currentSchoolHours, setCurrentSchoolHours] = useState(schoolHours);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LessonSchema>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      id: data?.id,
      title: data?.name || "", // map name to title
      day: data?.day || "MONDAY",
      startTime: data?.startTime || "09:00",
      endTime: data?.endTime || "10:00",
      subjectId: data?.subjectId || "",
      classId: data?.classId || "",
      teacherId: data?.teacherId || "",
    },
  });
  const [state, formAction] = useFormState(
    type === "create" ? createLesson : updateLesson,
    {
      success: false,
      error: false,
      message: "",
    }
  );

  const router = useRouter();

  const onSubmit = handleSubmit(async (formData) => {
    try {
      await formAction(formData);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to submit the form");
    }
  });
  useEffect(() => {
    if (state.success) {
      toast.success(`Lesson has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
      // Dispatch an event to notify BigCalendarContainer
      window.dispatchEvent(new Event('lesson-form-submitted'));
    } else if (state.error) {
      // Show specific error message if available, otherwise show generic error
      toast.error(state.message || "Failed to submit the form");
    }
  }, [state, router, type, setOpen]);

  // Initialize class hours when form loads or class changes
  useEffect(() => {
    if (selectedClassId) {
      const effectiveHours = getEffectiveHours(selectedClassId);
      setCurrentSchoolHours(effectiveHours);
    } else {
      setCurrentSchoolHours(schoolHours);
    }
  }, [selectedClassId, classes, schoolHours]);

  // Function to get effective hours for a class
  const getEffectiveHours = (classId: string) => {
    if (!classId) return schoolHours;
    
    const selectedClass = classes.find((cls: any) => cls.id.toString() === classId);
    if (!selectedClass) return schoolHours;
    
    // Use class custom hours if available, otherwise fall back to school hours
    if (selectedClass.customOpeningTime && selectedClass.customClosingTime) {
      return {
        openingTime: selectedClass.customOpeningTime,
        closingTime: selectedClass.customClosingTime
      };
    }
    
    return schoolHours;
  };

  // Filter teachers based on selected subject
  const filteredTeachers = useMemo(() => {
    if (!selectedSubjectId) return teachers;
    
    return teachers.filter((teacher: any) => 
      teacher.teacherSubjectClasses.some((assignment: any) => 
        assignment.subjectId.toString() === selectedSubjectId
      )
    );
  }, [teachers, selectedSubjectId]);

  // Validate time against current effective hours
  const validateTime = (time: string, type: 'start' | 'end') => {
    const timeValue = parseInt(time.replace(':', ''));
    const openingValue = parseInt(currentSchoolHours.openingTime.replace(':', ''));
    const closingValue = parseInt(currentSchoolHours.closingTime.replace(':', ''));
    
    if (timeValue < openingValue || timeValue > closingValue) {
      return `${type === 'start' ? 'Start' : 'End'} time must be between ${currentSchoolHours.openingTime} and ${currentSchoolHours.closingTime} (${selectedClassId ? 'class hours' : 'school hours'})`;
    }
    return null;
  };

  // Handle subject change
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubjectId = e.target.value;
    setSelectedSubjectId(newSubjectId);
    setValue("subjectId", parseInt(newSubjectId) || 0);
    
    // Reset teacher selection when subject changes
    setValue("teacherId", "");
  };

  // Handle class change
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClassId = e.target.value;
    setSelectedClassId(newClassId);
    setValue("classId", parseInt(newClassId) || 0);
    
    // Update school hours based on selected class
    const effectiveHours = getEffectiveHours(newClassId);
    setCurrentSchoolHours(effectiveHours);
  };

  // Handle time changes with validation
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
    setValue("startTime", newStartTime);
    
    const error = validateTime(newStartTime, 'start');
    if (error) {
      toast.error(error);
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = e.target.value;
    setEndTime(newEndTime);
    setValue("endTime", newEndTime);
    
    const error = validateTime(newEndTime, 'end');
    if (error) {
      toast.error(error);
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new lesson" : "Update the lesson"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Lesson title"
          name="title"
          defaultValue={data?.name} // map name to title
          register={register}
          error={errors?.title}
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

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Subject</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("subjectId")}
            value={selectedSubjectId}
            onChange={handleSubjectChange}
          >
            <option value="">Select a subject</option>
            {subjects.map((subject: { id: number; name: string }) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjectId?.message && (
            <p className="text-xs text-red-400">
              {errors.subjectId.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Class</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("classId")}
            value={selectedClassId}
            onChange={handleClassChange}
          >
            <option value="">Select a class</option>
            {classes.map((cls: { id: number; name: string }) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">
              {errors.classId.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">
            Teacher
            {selectedSubjectId && (
              <span className="text-blue-500 ml-1">
                (Only teachers assigned to selected subject)
              </span>
            )}
          </label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("teacherId")}
            defaultValue={data?.teacherId}
          >
            <option value="">
              {selectedSubjectId 
                ? filteredTeachers.length === 0 
                  ? "No teachers assigned to this subject" 
                  : "Select a teacher"
                : "Select a subject first"
              }
            </option>
            {filteredTeachers.map(
              (teacher: { id: string; name: string; surname: string }) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} {teacher.surname}
                </option>
              )
            )}
          </select>
          {errors.teacherId?.message && (
            <p className="text-xs text-red-400">
              {errors.teacherId.message.toString()}
            </p>
          )}
          {selectedSubjectId && filteredTeachers.length === 0 && (
            <p className="text-xs text-orange-500">
              No teachers are assigned to teach this subject. Please assign teachers to subjects first.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Day</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("day")}
            defaultValue={data?.day || "MONDAY"}
          >
            <option value="MONDAY">Monday</option>
            <option value="TUESDAY">Tuesday</option>
            <option value="WEDNESDAY">Wednesday</option>
            <option value="THURSDAY">Thursday</option>
            <option value="FRIDAY">Friday</option>
          </select>
          {errors.day?.message && (
            <p className="text-xs text-red-400">
              {errors.day.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">
            Start Time
            <span className="text-blue-500 ml-1">
              ({selectedClassId ? 'Class hours' : 'School hours'}: {currentSchoolHours.openingTime} - {currentSchoolHours.closingTime})
            </span>
          </label>
          <input
            type="time"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("startTime")}
            value={startTime}
            onChange={handleStartTimeChange}
            min={currentSchoolHours.openingTime}
            max={currentSchoolHours.closingTime}
          />
          {errors.startTime?.message && (
            <p className="text-xs text-red-400">
              {errors.startTime.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">
            End Time
            <span className="text-blue-500 ml-1">
              ({selectedClassId ? 'Class hours' : 'School hours'}: {currentSchoolHours.openingTime} - {currentSchoolHours.closingTime})
            </span>
          </label>
          <input
            type="time"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("endTime")}
            value={endTime}
            onChange={handleEndTimeChange}
            min={currentSchoolHours.openingTime}
            max={currentSchoolHours.closingTime}
          />
          {errors.endTime?.message && (
            <p className="text-xs text-red-400">
              {errors.endTime.message.toString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          className="py-2 px-4 bg-gray-200 rounded-md text-sm font-medium hover:bg-gray-300"
          onClick={() => setOpen(false)}
          type="button"
        >
          Cancel
        </button>
        <button
          className="py-2 px-4 bg-lamaYellow rounded-md text-sm font-medium hover:bg-yellow-500"
          type="submit"
        >
          {type === "create" ? "Create" : "Update"}
        </button>
      </div>
    </form>
  );
};

export default LessonForm;