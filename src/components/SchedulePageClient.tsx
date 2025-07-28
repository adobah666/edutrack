"use client";

import { useState, useEffect } from 'react';
import BigCalendarContainer from './BigCalendarContainer';

interface SchedulePageClientProps {
  selectedClassId: number;
}

const SchedulePageClient = ({ selectedClassId }: SchedulePageClientProps) => {
  const [key, setKey] = useState(0);

  // Listen for school hours updates and force refresh
  useEffect(() => {
    const handleSchoolHoursUpdate = () => {
      // Force remount of BigCalendarContainer by changing key
      setKey(prev => prev + 1);
    };

    window.addEventListener('school-hours-updated', handleSchoolHoursUpdate);
    return () => {
      window.removeEventListener('school-hours-updated', handleSchoolHoursUpdate);
    };
  }, []);

  return (
    <BigCalendarContainer
      type="classId"
      id={selectedClassId}
      key={`calendar-${selectedClassId}-${key}`}
    />
  );
};

export default SchedulePageClient;