"use client";

import { Announcement, Class } from "@prisma/client";
import FormModal from "../FormModal";

type AnnouncementWithClass = Announcement & {
  class: Class | null;
};

type Props = {
  announcement: AnnouncementWithClass;
};

export default function AnnouncementActions({ announcement }: Props) {
  return (
    <div className="flex items-center gap-2">
      <FormModal table="announcement" type="update" data={announcement} />
      <FormModal table="announcement" type="delete" id={announcement.id} />
    </div>
  );
}
