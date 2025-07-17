"use client";

import { useState } from "react";
import { Class, Parent, Student } from "@prisma/client";
import StudentDetailModal from "./modals/StudentDetailModal";
import Image from "next/image";

type Props = {
  student: Student & { 
    class: Class;
    parent?: Parent | null;
  };
};

export default function StudentRow({ student }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <Image
          src={student.img || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{student.name} {student.surname}</h3>
          <p className="text-xs text-gray-500">{student.class.name}</p>
        </div>
      </div>

      <StudentDetailModal
        student={student}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
