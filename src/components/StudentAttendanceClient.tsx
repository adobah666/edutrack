'use client';

import { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface AttendanceRecord {
  id: number;
  date: string;
  present: boolean;
  class: {
    id: number;
    name: string;
  };
}

interface ClassHistory {
  id: number;
  classId: number;
  startDate: string;
  endDate: string | null;
  class: {
    id: number;
    name: string;
  };
}

interface StudentAttendanceClientProps {
  student: {
    id: string;
    name: string;
    surname: string;
    currentClass: {
      id: number;
      name: string;
    } | null;
  };
  attendanceHistory: AttendanceRecord[];
  classHistory: ClassHistory[];
}

const StudentAttendanceClient = ({ 
  student, 
  attendanceHistory, 
  classHistory 
}: StudentAttendanceClientProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'history'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'term' | 'all'>('month');

  // Filter attendance by selected period
  const getFilteredAttendance = () => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'term':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        return attendanceHistory;
    }

    return attendanceHistory.filter(record => new Date(record.date) >= startDate);
  };

  // Get filtered attendance data
  const filteredAttendance = getFilteredAttendance();

  // Calculate attendance statistics based on filtered data
  const totalDays = filteredAttendance.length;
  const presentDays = filteredAttendance.filter(record => record.present).length;
  const absentDays = totalDays - presentDays;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Group attendance by class based on filtered data
  const attendanceByClass = filteredAttendance.reduce((acc, record) => {
    const className = record.class.name;
    if (!acc[className]) {
      acc[className] = { present: 0, absent: 0, total: 0, records: [] };
    }
    acc[className].total++;
    if (record.present) {
      acc[className].present++;
    } else {
      acc[className].absent++;
    }
    acc[className].records.push(record);
    return acc;
  }, {} as Record<string, { present: number; absent: number; total: number; records: AttendanceRecord[] }>);

  // Prepare calendar events based on filtered data
  const calendarEvents = filteredAttendance.map(record => ({
    id: record.id,
    title: record.present ? '✓ Present' : '✗ Absent',
    start: new Date(record.date),
    end: new Date(record.date),
    resource: {
      present: record.present,
      className: record.class.name
    }
  }));

  const eventStyleGetter = (event: any) => {
    const backgroundColor = event.resource.present ? '#10B981' : '#EF4444';
    const color = 'white';
    
    return {
      style: {
        backgroundColor,
        color,
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px'
      }
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'calendar', label: 'Calendar View', icon: '📅' },
    { key: 'history', label: 'Detailed History', icon: '📋' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Attendance</h1>
              <p className="text-gray-600">
                {student.name} {student.surname} - {student.currentClass?.name || 'No Current Class'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Overall Attendance Rate</div>
              <div className={`text-3xl font-bold ${attendanceRate >= 80 ? 'text-green-600' : attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {attendanceRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Period Filter */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">View Period:</span>
                  <div className="flex gap-2">
                    {[
                      { key: 'week', label: 'Last Week' },
                      { key: 'month', label: 'Last Month' },
                      { key: 'term', label: 'This Term' },
                      { key: 'all', label: 'All Time' }
                    ].map((period) => (
                      <button
                        key={period.key}
                        onClick={() => setSelectedPeriod(period.key as any)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          selectedPeriod === period.key
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600">Total Days</div>
                    <div className="text-2xl font-bold text-blue-900">{totalDays}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600">Present</div>
                    <div className="text-2xl font-bold text-green-900">{presentDays}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm text-red-600">Absent</div>
                    <div className="text-2xl font-bold text-red-900">{absentDays}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-600">Attendance Rate</div>
                    <div className="text-2xl font-bold text-purple-900">{attendanceRate}%</div>
                  </div>
                </div>

                {/* Attendance by Class */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance by Class</h3>
                  <div className="space-y-4">
                    {Object.entries(attendanceByClass).map(([className, stats]) => {
                      const classRate = Math.round((stats.present / stats.total) * 100);
                      return (
                        <div key={className} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{className}</h4>
                            <span className={`text-sm font-medium ${
                              classRate >= 80 ? 'text-green-600' : classRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {classRate}%
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Present:</span>
                              <div className="font-medium text-green-600">{stats.present}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Absent:</span>
                              <div className="font-medium text-red-600">{stats.absent}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Total:</span>
                              <div className="font-medium text-gray-900">{stats.total}</div>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  classRate >= 80 ? 'bg-green-500' : classRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${classRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Attendance Calendar</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>Absent</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ height: '600px' }}>
                  <Calendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    eventPropGetter={eventStyleGetter}
                    views={['month', 'week']}
                    defaultView="month"
                    popup
                    tooltipAccessor={(event: any) => 
                      `${event.title} - ${event.resource.className}`
                    }
                  />
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Detailed Attendance History</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAttendance.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.class.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.present 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {record.present ? 'Present' : 'Absent'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredAttendance.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-2">No attendance records found</div>
                    <p className="text-sm text-gray-400">
                      No attendance has been recorded for the selected period.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceClient;