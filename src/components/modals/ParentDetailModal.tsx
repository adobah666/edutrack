"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Parent, Student } from "@prisma/client";
import Image from "next/image";

interface ParentDetailModalProps {
  parent: Parent & { 
    students?: Student[] | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

const ParentDetailModal = ({
  parent,
  isOpen,
  onClose,
}: ParentDetailModalProps) => {
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
                <div className="flex items-start gap-4">
                  <Image
                    src={parent.img || "/noAvatar.png"}
                    alt={parent.name}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                      {parent.name} {parent.surname}
                    </Dialog.Title>
                    <div className="mt-1 text-sm text-gray-500">Parent ID: {parent.username}</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900">Contact Information</h4>
                    <dl className="mt-2 space-y-2">
                      <div>
                        <dt className="text-gray-500">Phone</dt>
                        <dd>{parent.phone}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Email</dt>
                        <dd>{parent.email || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Address</dt>
                        <dd>{parent.address}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Students</h4>
                    {parent.students && parent.students.length > 0 ? (
                      <div className="mt-2 space-y-3">
                        {parent.students.map((student) => (
                          <div key={student.id} className="bg-gray-50 p-2 rounded-lg">
                            <div className="font-medium">{student.name} {student.surname}</div>
                            <div className="text-xs text-gray-500">ID: {student.username}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-gray-500">No students assigned</p>
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

export default ParentDetailModal;
