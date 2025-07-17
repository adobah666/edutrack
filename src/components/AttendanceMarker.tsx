"use client";

import { useState } from "react";
import { Student } from "@prisma/client";
import { createAttendance } from "@/lib/actions";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";

type Props = {
  students: Student[];
  lessonId: number;
};

const initialState = {
  error: false,
  success: false,
  message: "",
};

export default function AttendanceMarker({ students, lessonId }: Props) {
  const [attendance, setAttendance] = useState<{ [key: string]: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" }>({});
  const [state, formAction] = useFormState(createAttendance, initialState);
  const handleSubmit = async () => {
    const date = new Date();
    const formData = {
      date,
      classId: lessonId,
      students: Object.entries(attendance).map(([studentId, status]) => ({
        id: studentId,
        isPresent: status === "PRESENT"
      }))
    };
    
    const result = await createAttendance(initialState, formData);
    
    if (result.success) {
      toast.success("Attendance marked successfully");
    } else {
      toast.error("Failed to mark attendance");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Mark Attendance</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {student.name} {student.surname}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    className="form-select block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                    value={attendance[student.id] || ""}
                    onChange={(e) => setAttendance({
                      ...attendance,
                      [student.id]: e.target.value as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
                    })}
                  >
                    <option value="">Select Status</option>
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                    <option value="EXCUSED">Excused</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Submit Attendance
        </button>
      </div>
    </div>
  );
}
