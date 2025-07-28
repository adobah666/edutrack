"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface SchoolHours {
  id: string;
  name: string;
  openingTime: string;
  closingTime: string;
}

interface ClassHours {
  id: number;
  name: string;
  customOpeningTime?: string;
  customClosingTime?: string;
  classScheduleOverrides?: {
    dayOfWeek: string;
    openingTime: string;
    closingTime: string;
  }[];
}

const DAYS = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
];

const AdvancedSchoolHoursConfig = () => {
  const [schoolHours, setSchoolHours] = useState<SchoolHours | null>(null);
  const [classes, setClasses] = useState<ClassHours[]>([]);
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('17:00');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'classes'>('general');
  const [selectedClass, setSelectedClass] = useState<ClassHours | null>(null);

  // Fetch current school hours and classes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schoolRes, classesRes] = await Promise.all([
          fetch('/api/school/hours'),
          fetch('/api/classes')
        ]);

        if (schoolRes.ok) {
          const schoolData = await schoolRes.json();
          setSchoolHours(schoolData);
          setOpeningTime(schoolData.openingTime || '08:00');
          setClosingTime(schoolData.closingTime || '17:00');
        }

        if (classesRes.ok) {
          const classesData = await classesRes.json();
          setClasses(classesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load school hours and classes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveGeneralHours = async () => {
    if (!openingTime || !closingTime) {
      toast.error('Please set both opening and closing times');
      return;
    }

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingTime, closingTime }),
      });

      const data = await response.json();

      if (response.ok) {
        setSchoolHours(data.school);
        toast.success('General school hours updated successfully!');
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

  const handleSaveClassHours = async (classId: number, customOpeningTime?: string, customClosingTime?: string) => {
    try {
      const response = await fetch(`/api/classes/${classId}/hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customOpeningTime, customClosingTime }),
      });

      if (response.ok) {
        const updatedClass = await response.json();
        setClasses(prev => prev.map(c => c.id === classId ? updatedClass : c));
        toast.success('Class hours updated successfully!');
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('class-hours-updated', {
          detail: { classId, customOpeningTime, customClosingTime }
        }));
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update class hours');
      }
    } catch (error) {
      console.error('Error updating class hours:', error);
      toast.error('Failed to update class hours');
    }
  };

  const handleSaveDayOverride = async (classId: number, dayOfWeek: string, openingTime: string, closingTime: string) => {
    try {
      const response = await fetch(`/api/classes/${classId}/day-override`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek, openingTime, closingTime }),
      });

      if (response.ok) {
        const updatedClass = await response.json();
        setClasses(prev => prev.map(c => c.id === classId ? updatedClass : c));
        toast.success(`${dayOfWeek} hours updated for class!`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update day override');
      }
    } catch (error) {
      console.error('Error updating day override:', error);
      toast.error('Failed to update day override');
    }
  };

  const getEffectiveHours = (classItem: ClassHours, day?: string) => {
    // Priority: Day override > Class custom > General school hours
    if (day && classItem.classScheduleOverrides) {
      const dayOverride = classItem.classScheduleOverrides.find(o => o.dayOfWeek === day);
      if (dayOverride) {
        return { openingTime: dayOverride.openingTime, closingTime: dayOverride.closingTime };
      }
    }
    
    if (classItem.customOpeningTime && classItem.customClosingTime) {
      return { openingTime: classItem.customOpeningTime, closingTime: classItem.customClosingTime };
    }
    
    return { openingTime, closingTime };
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
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Advanced School Hours Configuration</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span className="font-medium text-blue-800">Hierarchical Schedule System</span>
        </div>
        <p className="text-sm text-blue-700">
          Set general school hours, customize hours for specific classes, and override hours for specific days. 
          The system uses the most specific setting available: Day Override → Class Custom → General School Hours.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'general'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          General School Hours
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'classes'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Class-Specific Hours
        </button>
      </div>

      {/* General Hours Tab */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                General Opening Time
              </label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Default opening time for all classes</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                General Closing Time
              </label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Default closing time for all classes</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleSaveGeneralHours}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSaving ? 'Saving...' : 'Save General Hours'}
            </button>
          </div>
        </div>
      )}

      {/* Class-Specific Hours Tab */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {classes.map((classItem) => {
              const effectiveHours = getEffectiveHours(classItem);
              return (
                <div key={classItem.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">{classItem.name}</h3>
                  
                  {/* Class Custom Hours */}
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Custom Opening
                        </label>
                        <input
                          type="time"
                          value={classItem.customOpeningTime || ''}
                          onChange={(e) => {
                            const newClasses = classes.map(c => 
                              c.id === classItem.id 
                                ? { ...c, customOpeningTime: e.target.value || undefined }
                                : c
                            );
                            setClasses(newClasses);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder={openingTime}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Custom Closing
                        </label>
                        <input
                          type="time"
                          value={classItem.customClosingTime || ''}
                          onChange={(e) => {
                            const newClasses = classes.map(c => 
                              c.id === classItem.id 
                                ? { ...c, customClosingTime: e.target.value || undefined }
                                : c
                            );
                            setClasses(newClasses);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder={closingTime}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleSaveClassHours(
                        classItem.id, 
                        classItem.customOpeningTime, 
                        classItem.customClosingTime
                      )}
                      className="w-full px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save Class Hours
                    </button>
                  </div>

                  {/* Day Overrides */}
                  <div className="border-t pt-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Day-Specific Overrides</h4>
                    <div className="space-y-2">
                      {DAYS.map((day) => {
                        const dayOverride = classItem.classScheduleOverrides?.find(o => o.dayOfWeek === day.value);
                        return (
                          <div key={day.value} className="flex items-center gap-2 text-xs">
                            <span className="w-12 text-gray-600">{day.label.slice(0, 3)}</span>
                            <input
                              type="time"
                              value={dayOverride?.openingTime || ''}
                              onChange={(e) => {
                                if (e.target.value && dayOverride?.closingTime) {
                                  handleSaveDayOverride(classItem.id, day.value, e.target.value, dayOverride.closingTime);
                                }
                              }}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder={effectiveHours.openingTime}
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="time"
                              value={dayOverride?.closingTime || ''}
                              onChange={(e) => {
                                if (e.target.value && dayOverride?.openingTime) {
                                  handleSaveDayOverride(classItem.id, day.value, dayOverride.openingTime, e.target.value);
                                }
                              }}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder={effectiveHours.closingTime}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Current Effective Hours Display */}
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                    <span className="font-medium">Current effective hours:</span>
                    <div className="mt-1 space-y-1">
                      {DAYS.map((day) => {
                        const dayHours = getEffectiveHours(classItem, day.value);
                        return (
                          <div key={day.value} className="flex justify-between">
                            <span>{day.label}:</span>
                            <span>{dayHours.openingTime} - {dayHours.closingTime}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">How the Hierarchy Works:</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">1</span>
            <span><strong>Day Override:</strong> Specific day settings for a class (highest priority)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-orange-500 rounded-full text-xs flex items-center justify-center text-white font-bold">2</span>
            <span><strong>Class Custom:</strong> Custom hours for the entire class</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-500 rounded-full text-xs flex items-center justify-center text-white font-bold">3</span>
            <span><strong>General School:</strong> Default hours for all classes (fallback)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSchoolHoursConfig;