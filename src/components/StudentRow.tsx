"use client";

import { useState } from "react";
import { Class, Parent, Student } from "@prisma/client";
import StudentDetailModal from "./modals/StudentDetailModal";
import UserCredentialsModal from "./UserCredentialsModal";
import Image from "next/image";

type Props = {
  student: Student & { 
    class: Class;
    parent?: Parent | null;
  };
};

export default function StudentRow({ student }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-4 p-4">
        <div 
          className="flex items-center gap-4 cursor-pointer flex-1"
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
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCredentialsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          title="View login credentials"
        >
          🔑 Credentials
        </button>
      </div>

      <StudentDetailModal
        student={student}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <UserCredentialsModal
        userId={student.id}
        userType="student"
        userName={`${student.name} ${student.surname}`}
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
      />
    </>
  );
}
