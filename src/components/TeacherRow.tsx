"use client";

import { useState } from "react";
import { Teacher, Subject, Class } from "@prisma/client";
import TeacherDetailModal from "./modals/TeacherDetailModal";
import Image from "next/image";

type Props = {
  teacher: Teacher & { 
    subjects: Subject[];
    classes: Class[];
    teacherSubjectClasses?: {
      id: number;
      subject: { id: number; name: string };
      class: { id: number; name: string };
    }[];
  };
};

export default function TeacherRow({ teacher }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <Image
          src={teacher.img || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{teacher.name} {teacher.surname}</h3>
          <p className="text-xs text-gray-500">{teacher.email || teacher.phone}</p>
        </div>
      </div>

      <TeacherDetailModal
        teacher={teacher}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
