"use client";

import {
  deleteClass,
  deleteExam,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
  deleteLesson,
  deleteAssignment,
  deleteResult,
  deleteAttendance,
  deleteEvent,
  deleteAnnouncement,
  deleteStaffSalary,
  deleteSalaryPayment,
  deleteStaffBonus,
  deleteAccount,
  deleteTransaction,
} from "@/lib/actions";
import {
  deleteSchool,
  deleteAdmin,
} from "@/lib/school-actions";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";
import { Trash2 } from "lucide-react";

const deleteActionMap = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  exam: deleteExam,
  lesson: deleteLesson,
  assignment: deleteAssignment,
  result: deleteResult,
  attendance: deleteAttendance,
  event: deleteEvent,
  announcement: deleteAnnouncement,
  school: deleteSchool,
  admin: deleteAdmin,
  staffSalary: deleteStaffSalary,
  salaryPayment: deleteSalaryPayment,
  staffBonus: deleteStaffBonus,
  account: deleteAccount,
  transaction: deleteTransaction,
  studentFee: async (prevState: any, formData: FormData) => {
    // This is handled by the DeleteStudentFeeForm component
    // which includes password verification
    return prevState;
  },
};

type FormModalProps = FormContainerProps & {
  size?: string;
  bgColor?: string;
  relatedData?: any;
  buttonText?: string;
  buttonClassName?: string;
};

const FormModal = ({
  table,
  type,
  data,
  id,
  size = "p-3",
  bgColor = "bg-lamaPurple",
  relatedData,
  buttonText,
  buttonClassName,
}: FormModalProps) => {
  const [open, setOpen] = useState(false);

  const Form = () => {
    const [state, formAction] = useFormState(
      deleteActionMap[table as keyof typeof deleteActionMap],
      { success: false, error: false }
    );

    const router = useRouter();

    useEffect(() => {
      if (state.success) {
        toast(`${table} has been deleted!`);
        setOpen(false);
        router.refresh();
      }
    }, [state, router]);

    // Check if the form for this table type exists
    const formExists = forms[table] !== undefined;
    const deleteActionExists = table in deleteActionMap;

    if (type === "delete") {
      if ((!id && !data?.id) || !deleteActionExists) {
        return (
          <div className="p-4 text-center">
            Delete action not implemented for {table}
          </div>
        );
      }

      const deleteId = id || data?.id;

      // Use special DeleteStudentFeeForm for studentFee deletions
      if (table === "studentFee") {
        return <DeleteStudentFeeForm id={deleteId} setOpen={setOpen} />;
      }

      return (
        <form action={formAction} className="p-4 flex flex-col gap-4">
          <input type="text | number" name="id" value={deleteId} hidden />
          <span className="text-center font-medium">
            All data will be lost. Are you sure you want to delete this {table}?
          </span>
          <button className="bg-red-700 text-white py-2 px-4 rounded-md border-none w-max self-center">
            Delete
          </button>
        </form>
      );
    }

    return formExists ? (
      forms[table](setOpen, type, data, relatedData)
    ) : (
      <div className="p-4 text-center">
        Form for &quot;{table}&quot; not implemented yet!
      </div>
    );
  };

  const getButtonStyle = () => {
    switch (type) {
      case "create":
        return {
          bg: "bg-purple-600",
          hover: "hover:bg-purple-700",
          width: 20
        };
      case "update":
        return {
          bg: "bg-blue-600",
          hover: "hover:bg-blue-700",
          width: 20
        };
      case "delete":
        return {
          bg: "bg-red-500",
          hover: "hover:bg-red-600",
          width: 16,
          icon: "text-white"
        };
      default:
        return {
          bg: bgColor,
          hover: "hover:opacity-80",
          width: 16
        };
    }
  };

  const buttonStyle = buttonClassName 
    ? buttonClassName
    : buttonText
    ? 'flex items-center gap-2 py-2 px-4 rounded-md'
    : `${size} w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200`;

  const buttonStyles = getButtonStyle();
  return (
    <>
      <button
        className={buttonClassName ? buttonClassName : `${buttonStyle} ${buttonStyles.bg} ${buttonStyles.hover}`}
        onClick={() => setOpen(true)}
      >
        {type === "delete" ? (
          <Trash2 
            size={buttonStyles.width} 
            className={`transition-transform hover:scale-110 ${buttonStyles.icon || ''}`}
          />
        ) : (
          <Image 
            src={`/${type}.png`} 
            alt=""
            width={buttonStyles.width} 
            height={buttonStyles.width}
            className={`transition-transform hover:scale-110 ${buttonStyles.icon || ''}`}
          />
        )}
        {buttonText && <span>{buttonText}</span>}
      </button>
      {open && (
        <div className="w-screen h-screen fixed left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]">
            <Form />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ClassForm = dynamic(() => import("./forms/ClassForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ExamForm = dynamic(() => import("./forms/ExamForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ParentForm = dynamic(() => import("./forms/ParentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const LessonForm = dynamic(() => import("./forms/LessonForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ResultForm = dynamic(() => import("./forms/ResultForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AttendanceForm = dynamic(() => import("./forms/AttendanceForm"), {
  loading: () => <h1>Loading...</h1>,
});
const EventForm = dynamic(() => import("./forms/EventForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"), {
  loading: () => <h1>Loading...</h1>,
});
const FeeTypeForm = dynamic(() => import("./forms/FeeTypeForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ClassFeeForm = dynamic(() => import("./forms/ClassFeeForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StudentFeeForm = dynamic(() => import("./forms/StudentFeeForm"), {
  loading: () => <h1>Loading...</h1>,
});
const SchoolForm = dynamic(() => import("./forms/SchoolForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AdminForm = dynamic(() => import("./forms/AdminForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StaffSalaryForm = dynamic(() => import("./forms/StaffSalaryForm"), {
  loading: () => <h1>Loading...</h1>,
});
const SalaryPaymentForm = dynamic(() => import("./forms/SalaryPaymentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StaffBonusForm = dynamic(() => import("./forms/StaffBonusForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AccountForm = dynamic(() => import("./forms/AccountForm"), {
  loading: () => <h1>Loading...</h1>,
});
const TransactionForm = dynamic(() => import("./forms/TransactionForm"), {
  loading: () => <h1>Loading...</h1>,
});
const DeleteStudentFeeForm = dynamic(() => import("./forms/DeleteStudentFeeForm"), {
  loading: () => <h1>Loading...</h1>,
});

const forms: {
  [key: string]: (
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => JSX.Element;
} = {
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  class: (setOpen, type, data, relatedData) => (
    <ClassForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  student: (setOpen, type, data, relatedData) => (
    <StudentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  exam: (setOpen, type, data, relatedData) => (
    <ExamForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  parent: (setOpen, type, data, relatedData) => (
    <ParentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  lesson: (setOpen, type, data, relatedData) => (
    <LessonForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  assignment: (setOpen, type, data, relatedData) => (
    <AssignmentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  result: (setOpen, type, data, relatedData) => (
    <ResultForm
      type={type}
      data={data}
      setOpen={setOpen}
    />
  ),
  attendance: (setOpen, type, data, relatedData) => (
    <AttendanceForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  event: (setOpen, type, data, relatedData) => (
    <EventForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  announcement: (setOpen, type, data, relatedData) => (
    <AnnouncementForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  feeType: (setOpen, type, data, relatedData) => (
    <FeeTypeForm
      type={type}
      data={data}
      setOpen={setOpen}
    />
  ),
  classFee: (setOpen, type, data, relatedData) => {
    const { classes, feeTypes } = relatedData || {};
    return (
      <ClassFeeForm
        type={type}
        data={data}
        setOpen={setOpen}
        relatedData={{ classes: classes || [], feeTypes: feeTypes || [] }}
      />
    );
  },
  studentFee: (setOpen, type, data, relatedData) => (
    <StudentFeeForm
      type={type}
      data={data}
      setOpen={setOpen}
    />
  ),
  school: (setOpen, type, data, relatedData) => (
    <SchoolForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  admin: (setOpen, type, data, relatedData) => (
    <AdminForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  staffSalary: (setOpen, type, data, relatedData) => (
    <StaffSalaryForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  salaryPayment: (setOpen, type, data, relatedData) => (
    <SalaryPaymentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  staffBonus: (setOpen, type, data, relatedData) => (
    <StaffBonusForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  account: (setOpen, type, data, relatedData) => (
    <AccountForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  transaction: (setOpen, type, data, relatedData) => (
    <TransactionForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
};