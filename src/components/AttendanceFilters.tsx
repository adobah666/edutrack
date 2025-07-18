"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Class = {
  id: number;
  name: string;
};

export default function AttendanceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/classes');
        const data = await response.json();
        setClasses(data);
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      }
    };

    fetchClasses();
  }, []);

  const updateSearchParams = (key: string, value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
    router.push(url.pathname + url.search);
  };

  return (
    <div className="mt-4 mb-6 flex flex-wrap gap-4">
      <select 
        className="border border-gray-300 rounded-md p-2 text-sm"
        onChange={(e) => updateSearchParams("classId", e.target.value)}
        defaultValue={searchParams.get("classId") || ""}
      >
        <option value="">All Classes</option>
        {classes.map(class_ => (
          <option key={class_.id} value={class_.id}>
            {class_.name}
          </option>
        ))}
      </select>
      
      <select 
        className="border border-gray-300 rounded-md p-2 text-sm"
        onChange={(e) => updateSearchParams("present", e.target.value)}
        defaultValue={searchParams.get("present") || ""}
      >
        <option value="">All Statuses</option>
        <option value="true">Present</option>
        <option value="false">Absent</option>
      </select>
      
      <div className="flex items-center gap-2">
        <input
          type="date"
          className="border border-gray-300 rounded-md p-2 text-sm"
          placeholder="From"
          onChange={(e) => updateSearchParams("dateFrom", e.target.value)}
          defaultValue={searchParams.get("dateFrom") || ""}
        />
        <span>to</span>
        <input
          type="date"
          className="border border-gray-300 rounded-md p-2 text-sm"
          placeholder="To"
          onChange={(e) => updateSearchParams("dateTo", e.target.value)}
          defaultValue={searchParams.get("dateTo") || ""}
        />
      </div>
    </div>
  );
}
