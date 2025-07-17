"use client";

import { useState } from "react";
import { Announcement, Class } from "@prisma/client";
import AnnouncementDetailModal from "./modals/AnnouncementDetailModal";

type Props = {
  announcement: Announcement & { class: Class | null };
};

export default function AnnouncementTitle({ announcement }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        className="text-left hover:text-lamaPurple hover:underline"
        onClick={() => setIsModalOpen(true)}
      >
        {announcement.title}
      </button>

      <AnnouncementDetailModal
        announcement={announcement}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
