"use client";

import { useState } from "react";
import { Announcement, Class } from "@prisma/client";
import FormContainer from "./FormContainer";
import AnnouncementDetailModal from "./modals/AnnouncementDetailModal";

type AnnouncementList = Announcement & { class: Class };

type Props = {
  item: AnnouncementList;
  role?: string;
};

export default function ClientAnnouncementRow({ item, role }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <tr className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
        <td className="flex items-center gap-4 p-4">
          <button 
            className="text-left hover:text-lamaPurple hover:underline"
            onClick={() => setIsModalOpen(true)}
          >
            {item.title}
          </button>
        </td>
        <td>{item.class?.name || "-"}</td>
        <td className="hidden md:table-cell">
          {new Intl.DateTimeFormat("en-US").format(item.date)}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <>
                <FormContainer table="announcement" type="update" data={item} />
                <FormContainer table="announcement" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>

      <AnnouncementDetailModal
        announcement={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}