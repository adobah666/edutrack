"use client";

import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { useEffect } from "react";

const DeleteStudentFeeForm = ({
  id,
  setOpen,
}: {
  id: number;
  setOpen: (open: boolean) => void;
}) => {
  const [state, formAction] = useFormState(
    async (prevState: any, formData: FormData) => {
      try {
        const response = await fetch(`/api/student-fees/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          return { ...prevState, error: true, message: error.message };
        }

        return { ...prevState, success: true };
      } catch (error) {
        return { ...prevState, error: true, message: "An error occurred" };
      }
    },
    { success: false, error: false, message: "" }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success("Payment reversed successfully!");
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error(state.message || "Something went wrong!");
    }
  }, [state, router, setOpen]);

  return (
    <form action={formAction}>
      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5"
        >
          Reverse Payment
        </button>
      </div>
    </form>
  );
};

export default DeleteStudentFeeForm;
