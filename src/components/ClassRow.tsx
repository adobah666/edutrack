"use client";

import { useState } from "react";
import { Class, Teacher, Student } from "@prisma/client";
import ClassStudentsModal from "./modals/ClassStudentsModal";

type Props = {
  class: Class & { 
    supervisor: Teacher | null;
    students: Student[];
  };
};

export default function ClassRow({ class: classItem }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          className="text-left flex-1 hover:text-lamaPurple hover:underline"
          onClick={() => setIsModalOpen(true)}
        >
          {classItem.name}
        </button>
      </div>

      <ClassStudentsModal
        classData={classItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
