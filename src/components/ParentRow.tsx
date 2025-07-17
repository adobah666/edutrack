"use client";

import { useState } from "react";
import { Parent, Student } from "@prisma/client";
import ParentDetailModal from "./modals/ParentDetailModal";
import Image from "next/image";

type Props = {
  parent: Parent & { 
    students?: Student[] | null;
  };
  onAction?: (action: "update" | "delete", parent: Parent) => void;
};

export default function ParentRow({ parent, onAction }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <div 
        className="flex items-center gap-4 p-4 cursor-pointer"
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

      <ParentDetailModal
        parent={parent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
