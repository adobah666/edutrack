'use client';

import TableSearch from "@/components/TableSearch";
import ExamCreateButton from "@/components/client/ExamCreateForm";

type TermOption = {
  value: "ALL" | "FIRST" | "SECOND" | "THIRD" | "FINAL";
  label: string;
};

const termOptions: TermOption[] = [
  { value: "ALL", label: "All Terms" },
  { value: "FIRST", label: "First Term" },
  { value: "SECOND", label: "Second Term" },
  { value: "THIRD", label: "Third Term" },
  { value: "FINAL", label: "Final Term" },
];

export default function ExamFilters({
  currentTerm,
  isAdmin,
  onTermChange,
}: {
  currentTerm: string;
  isAdmin: boolean;
  onTermChange: (term: string) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="hidden md:block text-lg font-semibold">All Exams</h1>
      <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
        <TableSearch />
        <div className="flex items-center gap-4">
          <select
            className="p-2 border rounded-md"
            value={currentTerm}
            onChange={(e) => onTermChange(e.target.value)}
          >
            {termOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isAdmin && <ExamCreateButton />}
        </div>
      </div>
    </div>
  );
}
