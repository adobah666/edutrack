"use client";

import { useState } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export interface Event {
  id: number;
  title: string;
  subtitle?: string;
  start: Date;
  end: Date;
  day: string;
}

// Type for calendar slots
type CalendarSlot = Event | 'occupied' | null;

const TimeHeader = ({ schoolHours }: { schoolHours?: { openingTime: string; closingTime: string } }) => {
  const openingHour = schoolHours ? parseInt(schoolHours.openingTime.split(':')[0]) : 8;
  const closingHour = schoolHours ? parseInt(schoolHours.closingTime.split(':')[0]) : 17;
  const hours = Array.from({ length: closingHour - openingHour + 1 }, (_, i) => i + openingHour);
  
  return (
    <div className="flex border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="w-32 p-3 font-bold text-gray-700 bg-white border-r-2 border-gray-200">
        Day
      </div>
      {hours.map((hour) => (
        <div key={hour} className="flex-1 p-2 text-center font-semibold text-gray-600 border-l border-gray-200 min-w-[60px]">
          <span className="text-xs">{`${hour}:00`}</span>
        </div>
      ))}
    </div>
  );
};

const EventCell = ({ event, colSpan, isAdmin }: { event: Event; colSpan: number; isAdmin: boolean }) => {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = async () => {
    if (!isAdmin) return;

    try {
      const res = await fetch(`/api/lessons/${event.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete lesson');
      }

      toast.success('Lesson deleted successfully');
      // Notify calendar to refresh
      window.dispatchEvent(new Event('lesson-form-submitted'));
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  // Color variations for different subjects/events
  const getEventColor = (title: string) => {
    const colors = [
      'bg-gradient-to-r from-blue-400 to-blue-500 text-white',
      'bg-gradient-to-r from-green-400 to-green-500 text-white',
      'bg-gradient-to-r from-purple-400 to-purple-500 text-white',
      'bg-gradient-to-r from-orange-400 to-orange-500 text-white',
      'bg-gradient-to-r from-pink-400 to-pink-500 text-white',
      'bg-gradient-to-r from-indigo-400 to-indigo-500 text-white',
      'bg-gradient-to-r from-teal-400 to-teal-500 text-white',
    ];
    const hash = title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div 
      className={`${getEventColor(event.title)} rounded-lg p-2 h-full relative group shadow-sm hover:shadow-md transition-all duration-200 border border-white/20`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="font-semibold text-sm truncate mb-1">{event.title}</div>
      {event.subtitle && (
        <div className="text-xs opacity-90 truncate">{event.subtitle}</div>
      )}
      {showDelete && isAdmin && (
        <button 
          onClick={handleDelete}
          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
          title="Delete lesson"
        >
          <Image src="/delete.png" alt="Delete" width={12} height={12} />
        </button>
      )}
    </div>
  );
};

const BigCalendar = ({ data, isAdmin = false, schoolHours }: { 
  data: Event[]; 
  isAdmin?: boolean;
  schoolHours?: { openingTime: string; closingTime: string };
}) => {
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const openingHour = schoolHours ? parseInt(schoolHours.openingTime.split(':')[0]) : 8;
  const closingHour = schoolHours ? parseInt(schoolHours.closingTime.split(':')[0]) : 17;
  const hours = Array.from({ length: closingHour - openingHour + 1 }, (_, i) => i + openingHour);

  const getEventsForDay = (day: string) => {
    return data.filter(event => event.day === day);
  };

  const formatHourSlots = (events: Event[], dayHours: number[]): CalendarSlot[] => {
    const slots: CalendarSlot[] = new Array(dayHours.length).fill(null);
    
    events.forEach(event => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      const startHour = startDate.getHours();
      const endHour = endDate.getHours();
      
      // Find the starting position in our hours array
      const startIndex = dayHours.indexOf(startHour);
      
      if (startIndex !== -1) {
        // Calculate duration in hours (minimum 1 hour)
        let duration = Math.max(1, endHour - startHour);
        
        // Ensure we don't exceed the available slots
        duration = Math.min(duration, dayHours.length - startIndex);
        
        // Place the event in the first slot and mark subsequent slots as occupied
        slots[startIndex] = event;
        for (let i = 1; i < duration; i++) {
          if (startIndex + i < slots.length) {
            slots[startIndex + i] = 'occupied';
          }
        }
      }
    });
    
    return slots;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="min-w-[1000px] overflow-x-auto">
        <TimeHeader schoolHours={schoolHours} />
        <div className="divide-y divide-gray-200">
          {days.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(day);
            const hourSlots = formatHourSlots(dayEvents, hours);
            
            return (
              <div key={day} className={`flex hover:bg-gray-50/50 transition-colors duration-150 ${dayIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                <div className="w-32 p-4 font-bold text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 border-r-2 border-gray-200 flex items-center">
                  <span className="text-sm">{day}</span>
                </div>
                <div className="flex-1 grid gap-1 p-1" style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}>
                  {hourSlots.map((slot, index) => {
                    // Empty slot
                    if (slot === null) {
                      return (
                        <div key={`${day}-${hours[index]}`} className="border-l border-gray-200 min-h-[70px] hover:bg-blue-50/30 transition-colors duration-150" />
                      );
                    }
                    
                    // Occupied slot (part of a multi-hour event)
                    if (slot === 'occupied') {
                      return (
                        <div key={`${day}-${hours[index]}`} className="border-l border-gray-200 min-h-[70px]" />
                      );
                    }
                    
                    // Event slot
                    const event = slot as Event;
                    const endHour = new Date(event.end).getHours();
                    const startHour = new Date(event.start).getHours();
                    const colSpan = Math.max(1, Math.min(endHour - startHour, hours.length - index));
                    
                    return (
                      <div key={`${day}-${hours[index]}`} className="border-l border-gray-200 min-h-[70px] p-1" style={{ gridColumn: `span ${colSpan}` }}>
                        <EventCell event={event} colSpan={1} isAdmin={isAdmin} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BigCalendar;
