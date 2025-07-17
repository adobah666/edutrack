"use client";

import { Event, Class } from "@prisma/client";
import EventActions from "./EventActions";

type EventRow = Event & {
  class: Class | null;
};

type Props = {
  item: EventRow;
  role?: string;
};

export default function EventRow({ item, role }: Props) {
  return (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.class?.name || "-"}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.startTime)}
        {" "}
        {item.startTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.endTime)}
        {" "}
        {item.endTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>      {role === "admin" && (
        <td>
          <EventActions event={item} />
        </td>
      )}
    </tr>
  );
}
