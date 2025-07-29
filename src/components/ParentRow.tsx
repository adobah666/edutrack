"use client";

import { useState } from "react";
import { Parent, Student } from "@prisma/client";
import ParentDetailModal from "./modals/ParentDetailModal";
import UserCredentialsModal from "./UserCredentialsModal";
import Image from "next/image";

type Props = {
  parent: Parent & { 
    students?: Student[] | null;
    parentStudents?: {
      id: number;
      relationshipType: string;
      student: { id: string; name: string; surname: string };
    }[];
  };
  onAction?: (action: "update" | "delete", parent: Parent) => void;
};

export default function ParentRow({ parent, onAction }: Props) {
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
            src={parent.img || "/noAvatar.png"}
            alt=""
            width={40}
            height={40}
            className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <h3 className="font-semibold">{parent.name} {parent.surname}</h3>
            <p className="text-xs text-gray-500">{parent.email || parent.phone}</p>
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

      <ParentDetailModal
        parent={parent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <UserCredentialsModal
        userId={parent.id}
        userType="parent"
        userName={`${parent.name} ${parent.surname}`}
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
      />
    </>
  );
}
