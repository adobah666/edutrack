"use client";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Views } from "react-big-calendar";

export interface Event {
  id: number;
  title: string;
  subtitle?: string;
  start: Date;
  end: Date;
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";
}

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const formats = {
  eventTimeRangeFormat: () => "", // Hide the time range in the event
  dayHeaderFormat: (date: Date) => format(date, "EEEE"), // Show only day name
};

const TimeGutterHeader = () => {
  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM
  return (
    <div className="flex">
      <div className="w-24"></div> {/* Empty cell for day column */}
      {hours.map((hour) => (
        <div key={hour} className="flex-1 text-center font-medium">
          {`${hour}:00`}
        </div>
      ))}
    </div>
  );
};

const CustomAgendaView = ({ events }: { events: Event[] }) => {
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM

  const getEventForTimeSlot = (day: string, hour: number) => {
    return events.find((event) => {
      const eventHour = event.start.getHours();
      return event.day === day && eventHour === hour;
    });
  };

  return (
    <div className="w-full">
      <TimeGutterHeader />
      <div className="mt-2">
        {days.map((day) => (
          <div key={day} className="flex border-t py-2">
            <div className="w-24 font-medium">{day}</div>
            {hours.map((hour) => {
              const event = getEventForTimeSlot(day, hour);
              return (
                <div key={`${day}-${hour}`} className="flex-1 px-1">
                  {event && (
                    <div className="bg-blue-100 rounded p-1 text-sm">
                      <div className="font-medium">{event.title}</div>
                      {event.subtitle && (
                        <div className="text-xs">{event.subtitle}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

interface BigCalendarProps {
  data: Event[];
}

const BigCalendar = ({ data }: BigCalendarProps) => {
  return (
    <div className="h-[600px] bg-white rounded-lg shadow-sm p-4">
      <CustomAgendaView events={data} />
    </div>
  );
};

export default BigCalendar;
