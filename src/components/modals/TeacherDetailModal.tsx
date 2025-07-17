"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Teacher, Subject, Class } from "@prisma/client";
import Image from "next/image";

interface TeacherDetailModalProps {
  teacher: Teacher & { 
    subjects: Subject[];
    classes: Class[];
  };
  isOpen: boolean;
  onClose: () => void;
}

const TeacherDetailModal = ({
  teacher,
  isOpen,
  onClose,
}: TeacherDetailModalProps) => {
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
                    src={teacher.img || "/noAvatar.png"}
                    alt={teacher.name}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                      {teacher.name} {teacher.surname}
                    </Dialog.Title>
                    <div className="mt-1 text-sm text-gray-500">Teacher ID: {teacher.username}</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900">Personal Information</h4>
                    <dl className="mt-2 space-y-2">
                      <div>
                        <dt className="text-gray-500">Email</dt>
                        <dd>{teacher.email || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Phone</dt>
                        <dd>{teacher.phone}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Address</dt>
                        <dd>{teacher.address}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Blood Type</dt>
                        <dd>{teacher.bloodType}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Sex</dt>
                        <dd>{teacher.sex}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Birthday</dt>
                        <dd>{new Intl.DateTimeFormat('en-US').format(new Date(teacher.birthday))}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Subjects</h4>
                      {teacher.subjects.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {teacher.subjects.map((subject) => (
                            <span 
                              key={subject.id} 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lamaPurple text-white"
                            >
                              {subject.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-gray-500">No subjects assigned</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900">Classes</h4>
                      {teacher.classes.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {teacher.classes.map((classItem) => (
                            <span 
                              key={classItem.id} 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lamaSky text-white"
                            >
                              {classItem.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-gray-500">No classes assigned</p>
                      )}
                    </div>
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

export default TeacherDetailModal;
