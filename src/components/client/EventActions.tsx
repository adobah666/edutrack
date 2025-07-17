"use client";

import { Event, Class } from "@prisma/client";
import FormModal from "../FormModal";

type EventWithClass = Event & {
  class: Class | null;
};

type EventActionsProps = {
  event: EventWithClass;
};

export default function EventActions({ event }: EventActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <FormModal 
        table="event" 
        type="update" 
        data={event} 
      />
      <FormModal 
        table="event" 
        type="delete" 
        id={event.id} 
      />
    </div>
  );
}
