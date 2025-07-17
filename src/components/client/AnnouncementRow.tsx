"use client";

import { Announcement, Class } from "@prisma/client";
import AnnouncementTitle from "../AnnouncementTitle";
import AnnouncementActions from "./AnnouncementActions";

type AnnouncementWithClass = Announcement & {
  class: Class | null;
};

type Props = {
  item: AnnouncementWithClass;
  role?: string;
};

export default function AnnouncementRow({ item, role }: Props) {
  return (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <AnnouncementTitle announcement={item} />
      </td>
      <td>{item.class?.name || "-"}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.date)}
      </td>
      {role === "admin" && (
        <td>
          <AnnouncementActions announcement={item} />
        </td>
      )}
    </tr>
  );
}
