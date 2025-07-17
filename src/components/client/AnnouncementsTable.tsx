"use client";

import { Announcement, Class } from "@prisma/client";
import Table from "../Table";
import AnnouncementRow from "./AnnouncementRow";

type AnnouncementWithClass = Announcement & {
  class: Class | null;
};

type Props = {
  data: AnnouncementWithClass[];
  role?: string;
};

export default function AnnouncementsTable({ data, role }: Props) {
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
      header: "Date",
      accessor: "date",
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
      renderCustomRow={(item) => <AnnouncementRow item={item} role={role} />}
      emptyMessage="No announcements found"
    />
  );
}
