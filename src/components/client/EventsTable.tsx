"use client";

import { Event, Class } from "@prisma/client";
import Table from "../Table";
import EventRow from "./EventRow";

type EventWithClass = Event & {
  class: Class | null;
};

type EventsTableProps = {
  data: EventWithClass[];
  role?: string;
};

export default function EventsTable({ data, role }: EventsTableProps) {
  const columns = [
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Start Time",
      accessor: "startTime",
      className: "hidden md:table-cell",
    },
    {
      header: "End Time",
      accessor: "endTime",
      className: "hidden md:table-cell",
    },
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  return (
    <Table 
      columns={columns}
      data={data}
      renderCustomRow={(item) => <EventRow item={item} role={role} />}
      emptyMessage="No events found"
    />
  );
}
