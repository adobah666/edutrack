"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface SubjectFilterProps {
  subjects: {
    id: number;
    name: string;
  }[];
  selectedSubjectId?: string;
}

const SubjectFilter = ({ subjects, selectedSubjectId }: SubjectFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSubjectSelect = (subjectId: number | null) => {
    // Construct URL with current search params
    const url = new URL(window.location.href);
    
    // Remove the subject filter or set it
    if (subjectId === null) {
      url.searchParams.delete('subjectId');
    } else {
      url.searchParams.set('subjectId', subjectId.toString());
    }
    
    // Keep the page at 1 when filter changes
    url.searchParams.set('page', '1');
    
    // Navigate to the new URL
    router.push(url.toString().replace(window.location.origin, ''));
    setIsOpen(false);
  };

  // Find the currently selected subject name for display
  const selectedSubject = selectedSubjectId 
    ? subjects.find(s => s.id === parseInt(selectedSubjectId, 10))
    : null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-lamaYellow rounded-full text-sm"
        title="Filter by subject"
      >
        <Image src="/filter.png" alt="Filter" width={14} height={14} />
        <span className="hidden md:inline">
          {selectedSubject ? `Subject: ${selectedSubject.name}` : "Filter by Subject"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-md z-10 w-48">
          <ul className="py-1">
            <li 
              className="px-4 py-2 hover:bg-lamaPurpleLight cursor-pointer text-sm"
              onClick={() => handleSubjectSelect(null)}
            >
              All Subjects
            </li>
            {subjects.map((subject) => (
              <li
                key={subject.id}
                className={`px-4 py-2 hover:bg-lamaPurpleLight cursor-pointer text-sm ${
                  selectedSubjectId && parseInt(selectedSubjectId, 10) === subject.id ? "bg-lamaPurpleLight" : ""
                }`}
                onClick={() => handleSubjectSelect(subject.id)}
              >
                {subject.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SubjectFilter;