'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const termOptions = [
  { value: "ALL", label: "All Terms" },
  { value: "FIRST", label: "First Term" },
  { value: "SECOND", label: "Second Term" },
  { value: "THIRD", label: "Third Term" },
  { value: "FINAL", label: "Final Term" },
];

export default function TermFilter() {
  const pathname = usePathname();
  const { replace } = useRouter();
  const params = useSearchParams();
  const currentTerm = params.get('term') || "ALL";

  const handleTermFilter = (term: string) => {
    const newParams = new URLSearchParams(params.toString());
    if (term && term !== "ALL") {
      newParams.set("term", term);
    } else {
      newParams.delete("term");
    }
    replace(`${pathname}?${newParams.toString()}`);
  };

  return (
    <select
      className="p-2 border rounded-md"
      value={currentTerm}
      onChange={(e) => handleTermFilter(e.target.value)}
    >
      {termOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
