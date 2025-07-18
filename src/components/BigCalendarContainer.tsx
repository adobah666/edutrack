﻿"use client";

import { useEffect, useState, useCallback } from "react";
import BigCalender from "./BigCalender";
import type { Event } from "./BigCalender";
import { Lesson, Subject, Teacher, Class } from "@prisma/client";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";
import ScheduleClassFilter from "./ScheduleClassFilter";
import { useUser } from "@clerk/nextjs";

export default function BigCalenderContainer({
  type,
  id,
}: {
  type: "teacherId" | "classId";
  id: string | number;
}) {
  const [schedule, setSchedule] = useState<Event[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const isAdmin = user?.publicMetadata.role === "admin";

  // Create a fetchData function that we can reuse
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const lessonsRes = await fetch(`/api/lessons?${type}=${id}`, {
        // Add cache: 'no-store' to prevent caching
        cache: 'no-store'
      });
      if (!lessonsRes.ok) throw new Error("Failed to fetch lessons");
      
      const lessons = await lessonsRes.json();
      const data = lessons.map((lesson: Lesson & { subject: Subject; teacher: Teacher; class: Class }) => ({
        id: lesson.id,
        title: `${lesson.subject.name} - ${lesson.class.name}`,
        subtitle: `${lesson.teacher.name} ${lesson.teacher.surname}`,
        start: new Date(lesson.startTime),
        end: new Date(lesson.endTime),
        day: lesson.day,
      }));

      setSchedule(adjustScheduleToCurrentWeek(data));

      if (type === "classId") {
        try {
          const classesRes = await fetch("/api/classes", {
            cache: 'no-store'
          });
          if (!classesRes.ok) throw new Error();
          setClasses(await classesRes.json());
        } catch {
          // If fetching classes fails, just skip the filter, don't set error
          setClasses([]);
        }
      }
    } catch (err) {
      setError("Failed to load schedule");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id, type]);

  // Fetch initial data
  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  // Set up listeners for form submission
  useEffect(() => {
    const handleFormSubmitted = () => {
      fetchData();
    };

    window.addEventListener('lesson-form-submitted', handleFormSubmitted);
    
    return () => {
      window.removeEventListener('lesson-form-submitted', handleFormSubmitted);
    };
  }, [fetchData]);

  // Set up periodic refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(fetchData, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData]);

  // Listen for lesson updates
  useEffect(() => {
    const handleLessonUpdate = () => {
      fetchData();
    };

    window.addEventListener('lesson-updated', handleLessonUpdate);
    return () => {
      window.removeEventListener('lesson-updated', handleLessonUpdate);
    };
  }, [fetchData]);

  if (error) {
    return (
      <div className="flex justify-center items-center h-[400px] bg-red-50 rounded-lg">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px] bg-white rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {type === "classId" && classes.length > 0 && (
        <ScheduleClassFilter classes={classes} currentClassId={Number(id)} />
      )}
      <BigCalender data={schedule} isAdmin={isAdmin} />
    </div>
  );
}
