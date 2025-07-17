"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Class, Student } from "@prisma/client";
import Image from "next/image";

interface ClassStudentsModalProps {
  classData: Class & { students: Student[] };
  isOpen: boolean;
  onClose: () => void;
}

const ClassStudentsModal = ({
  classData,
  isOpen,
  onClose,
}: ClassStudentsModalProps) => {
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
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-start">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6">
                    {classData.name} - Students
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1 hover:bg-gray-100"
                  >
                    <Image src="/close.png" alt="Close" width={20} height={20} />
                  </button>
                </div>

                <div className="mt-4">
                  {classData.students.length === 0 ? (
                    <p className="text-sm text-gray-500">No students in this class yet.</p>
                  ) : (
                    <div className="divide-y">
                      {classData.students.map((student) => (
                        <div key={student.id} className="flex items-center gap-4 py-3">
                          <Image
                            src={student.img || "/noAvatar.png"}
                            alt=""
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-medium">{student.name} {student.surname}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ClassStudentsModal;
