import { z } from "zod";

export const lessonSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Lesson title is required!" }),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], { 
    message: "Day is required!" 
  }),
  startTime: z.string().min(1, { message: "Start time is required!" }),
  endTime: z.string().min(1, { message: "End time is required!" }),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
}).refine((data) => {
  const [startHour, startMinute] = data.startTime.split(':').map(Number);
  const [endHour, endMinute] = data.endTime.split(':').map(Number);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  return endTotal > startTotal;
}, {
  message: "End time must be later than start time",
  path: ["endTime"]
});

export type LessonSchema = z.infer<typeof lessonSchema>;
