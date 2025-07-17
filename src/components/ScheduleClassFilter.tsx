"use client";

import { useRouter, useSearchParams } from "next/navigation";

const ScheduleClassFilter = ({
  classes,
  currentClassId,
}: {
  classes: { id: number; name: string }[];
  currentClassId: number;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (classId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("classId", classId);
    router.push(`/schedule?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Class:</label>
      <select
        className="border rounded-md px-2 py-1"
        value={currentClassId}
        onChange={(e) => handleChange(e.target.value)}
      >
        {classes.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ScheduleClassFilter;
