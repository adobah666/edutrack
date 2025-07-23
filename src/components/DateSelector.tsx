"use client";

import { useRouter, useSearchParams } from "next/navigation";

type DateSelectorProps = {
  selectedDate?: string;
};

const DateSelector = ({ selectedDate }: DateSelectorProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (newDate) {
      params.set('selectedDate', newDate);
    } else {
      params.delete('selectedDate');
    }
    
    router.push(`/list/attendance?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-4">
      <label htmlFor="date-selector" className="text-sm font-medium text-gray-700">
        Select Date:
      </label>
      <input
        id="date-selector"
        type="date"
        defaultValue={selectedDate || new Date().toISOString().split('T')[0]}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={handleDateChange}
      />
    </div>
  );
};

export default DateSelector;