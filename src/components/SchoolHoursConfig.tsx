"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface SchoolHours {
  id: string;
  name: string;
  openingTime: string;
  closingTime: string;
}

const SchoolHoursConfig = () => {
  const [schoolHours, setSchoolHours] = useState<SchoolHours | null>(null);
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('17:00');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current school hours
  useEffect(() => {
    const fetchSchoolHours = async () => {
      try {
        const response = await fetch('/api/school/hours');
        if (response.ok) {
          const data = await response.json();
          setSchoolHours(data);
          setOpeningTime(data.openingTime || '08:00');
          setClosingTime(data.closingTime || '17:00');
        } else {
          // Use defaults if fetch fails
          setOpeningTime('08:00');
          setClosingTime('17:00');
        }
      } catch (error) {
        console.error('Error fetching school hours:', error);
        toast.error('Failed to load school hours');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolHours();
  }, []);

  const handleSave = async () => {
    if (!openingTime || !closingTime) {
      toast.error('Please set both opening and closing times');
      return;
    }

    // Validate that opening time is before closing time
    const openingMinutes = parseInt(openingTime.split(':')[0]) * 60 + parseInt(openingTime.split(':')[1]);
    const closingMinutes = parseInt(closingTime.split(':')[0]) * 60 + parseInt(closingTime.split(':')[1]);
    
    if (openingMinutes >= closingMinutes) {
      toast.error('Opening time must be before closing time');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/school/hours', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openingTime,
          closingTime,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSchoolHours(data.school);
        toast.success('School hours updated successfully!');
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('school-hours-updated', {
          detail: { openingTime, closingTime }
        }));
      } else {
        toast.error(data.error || 'Failed to update school hours');
      }
    } catch (error) {
      console.error('Error updating school hours:', error);
      toast.error('Failed to update school hours');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">School Hours Configuration</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span className="font-medium text-blue-800">Configure School Operating Hours</span>
        </div>
        <p className="text-sm text-blue-700">
          Set your school's opening and closing times. These hours will be used to validate lesson scheduling and display the schedule calendar.
        </p>
        {schoolHours && (
          <p className="text-sm text-blue-600 mt-2">
            <strong>Current hours for {schoolHours.name}:</strong> {schoolHours.openingTime} - {schoolHours.closingTime}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Opening Time
            </label>
            <input
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">When does your school day start?</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Closing Time
            </label>
            <input
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">When does your school day end?</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSaving ? 'Saving...' : 'Save School Hours'}
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="font-medium text-gray-900 mb-2">How School Hours Work:</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Schedule calendar displays only within these hours
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Lessons cannot be scheduled outside these hours
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Time validation prevents scheduling conflicts
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Each school can have different operating hours
            </li>
          </ul>
        </div>

        {/* Preview Section */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-2">Preview:</h3>
          <div className="text-sm text-green-700">
            <p><strong>School will operate from:</strong> {openingTime} to {closingTime}</p>
            <p><strong>Schedule calendar will show:</strong> {parseInt(openingTime.split(':')[0])}:00 - {parseInt(closingTime.split(':')[0])}:00</p>
            <p><strong>Total operating hours:</strong> {Math.round((parseInt(closingTime.split(':')[0]) * 60 + parseInt(closingTime.split(':')[1]) - parseInt(openingTime.split(':')[0]) * 60 - parseInt(openingTime.split(':')[1])) / 60 * 10) / 10} hours</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolHoursConfig;