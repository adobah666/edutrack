"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Class, Teacher, Student } from "@prisma/client";
import Image from "next/image";

interface ClassDetailModalProps {
  class: Class & { 
    supervisor: Teacher | null;
    students: Student[];
  };
  isOpen: boolean;
  onClose: () => void;
}

const ClassDetailModal = ({
  class: classItem,
  isOpen,
  onClose,
}: ClassDetailModalProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                      {classItem.name}
                    </Dialog.Title>
                    <div className="mt-1 text-sm text-gray-500">
                      Capacity: {classItem.capacity} students
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">Supervisor</div>
                    <div className="text-sm text-gray-500">
                      {classItem.supervisor 
                        ? `${classItem.supervisor.name} ${classItem.supervisor.surname}`
                        : "No supervisor assigned"}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 flex items-center justify-between">
                    <span>Students ({classItem.students.length})</span>
                    <span className="text-sm text-gray-500">
                      {classItem.students.length}/{classItem.capacity} seats filled
                    </span>
                  </h4>
                  
                  <div className="mt-4 divide-y divide-gray-100">
                    {classItem.students.length > 0 ? (
                      classItem.students.map((student) => (
                        <div key={student.id} className="flex items-center gap-4 py-3">
                          <Image
                            src={student.img || "/noAvatar.png"}
                            alt={student.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                          <div>
                            <div className="font-medium">{student.name} {student.surname}</div>
                            <div className="text-sm text-gray-500">ID: {student.username}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="py-3 text-gray-500">No students enrolled in this class</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="rounded-md bg-lamaPurple px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ClassDetailModal;
