"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

interface ClassFilterProps {
  classes: {
    id: string;
    name: string;
  }[];
  selectedClassId?: string;
}

const ClassFilter = ({ classes, selectedClassId }: ClassFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleClassSelect = (classId: string | null) => {
    // Construct URL with current search params
    const url = new URL(window.location.href);
    
    // Remove the class filter or set it
    if (classId === null) {
      url.searchParams.delete('classId');
    } else {
      url.searchParams.set('classId', classId);
    }
    
    // Keep the page at 1 when filter changes
    url.searchParams.set('page', '1');
    
    // Navigate to the new URL
    router.push(url.toString().replace(window.location.origin, ''));
    setIsOpen(false);
  };

  // Find the currently selected class name for display
  const selectedClass = selectedClassId 
    ? classes.find(c => c.id === selectedClassId)
    : null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-lamaYellow rounded-full text-sm"
        title="Filter by class"
      >
        <Image src="/filter.png" alt="Filter" width={14} height={14} />
        <span className="hidden md:inline">
          {selectedClass ? `Class: ${selectedClass.name}` : "Filter by Class"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-md z-10 w-48">
          <ul className="py-1">
            <li 
              className="px-4 py-2 hover:bg-lamaPurpleLight cursor-pointer text-sm"
              onClick={() => handleClassSelect(null)}
            >
              All Classes
            </li>
            {classes.map((cls) => (
              <li
                key={cls.id}
                className={`px-4 py-2 hover:bg-lamaPurpleLight cursor-pointer text-sm ${
                  selectedClassId === cls.id ? "bg-lamaPurpleLight" : ""
                }`}
                onClick={() => handleClassSelect(cls.id)}
              >
                {cls.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClassFilter;