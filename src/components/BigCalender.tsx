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

const TimeHeader = () => {
  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM
  return (
    <div className="flex border-b">
      <div className="w-32 p-2 font-semibold">Day</div>
      {hours.map((hour) => (
        <div key={hour} className="flex-1 p-2 text-center font-semibold border-l">
          {`${hour}:00`}
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

  return (
    <div 
      className="bg-blue-100 rounded p-1 h-full relative group" 
      style={{ gridColumn: `span ${colSpan}` }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="font-medium text-sm truncate">{event.title}</div>
      {event.subtitle && (
        <div className="text-xs text-gray-600 truncate">{event.subtitle}</div>
      )}
      {showDelete && isAdmin && (
        <button 
          onClick={handleDelete}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Image src="/delete.png" alt="Delete" width={12} height={12} />
        </button>
      )}
    </div>
  );
};

const BigCalendar = ({ data, isAdmin = false }: { data: Event[]; isAdmin?: boolean }) => {
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM

  const getEventsForDay = (day: string) => {
    return data.filter(event => event.day === day);
  };

  const formatHourSlots = (events: Event[], dayHours: number[]) => {
    const slots: (Event | null)[] = new Array(dayHours.length).fill(null);
    
    events.forEach(event => {
      const startHour = new Date(event.start).getHours();
      const endHour = new Date(event.end).getHours();
      const startIndex = dayHours.indexOf(startHour);
      
      if (startIndex !== -1) {
        // Calculate how many slots this event should span
        const duration = Math.min(endHour - startHour, dayHours.length - startIndex);
        
        // Mark all slots that this event spans
        for (let i = 0; i < duration; i++) {
          slots[startIndex + i] = i === 0 ? event : null;
        }
      }
    });
    
    return slots;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
      <div className="min-w-[800px]">
        <TimeHeader />
        <div className="divide-y">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const hourSlots = formatHourSlots(dayEvents, hours);
            
            return (
              <div key={day} className="flex">
                <div className="w-32 p-2 font-medium">{day}</div>
                <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}>
                  {hourSlots.map((slot, index) => {
                    if (slot === null) return (
                      <div key={`${day}-${hours[index]}`} className="border-l min-h-[60px]" />
                    );
                    
                    const endHour = new Date(slot.end).getHours();
                    const startHour = new Date(slot.start).getHours();
                    const colSpan = Math.min(endHour - startHour, hours.length - index);
                    
                    return (
                      <div key={`${day}-${hours[index]}`} className="border-l min-h-[60px]">
                        <EventCell event={slot} colSpan={colSpan} isAdmin={isAdmin} />
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
