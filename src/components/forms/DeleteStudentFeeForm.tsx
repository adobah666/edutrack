"use client";

import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";

const DeleteStudentFeeForm = ({
  id,
  setOpen,
}: {
  id: number;
  setOpen: (open: boolean) => void;
}) => {
  const [adminPassword, setAdminPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [state, formAction] = useFormState(
    async (prevState: any, formData: FormData) => {
      try {
        const adminPassword = formData.get("adminPassword") as string;
        console.log("Sending password:", adminPassword, "Length:", adminPassword?.length);
        
        const response = await fetch(`/api/student-fees/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminPassword }),
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const error = await response.json();
          console.log("Error response:", error);
          return { ...prevState, error: true, message: error.message };
        }

        return { ...prevState, success: true };
      } catch (error) {
        console.error("Client error:", error);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showPasswordField) {
      setShowPasswordField(true);
      return;
    }

    if (!adminPassword.trim()) {
      toast.error("Admin password is required to reverse payment");
      return;
    }

    const formData = new FormData();
    formData.append("adminPassword", adminPassword);
    formAction(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Reverse Payment</h3>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to reverse this payment? This action cannot be undone.
        </p>

        {showPasswordField && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter your admin account password"
                required
              />
              <p className="text-xs text-red-500 mt-1">
                ⚠️ Enter your admin account password to verify this action
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-800 font-medium">Security Verification Required</span>
              </div>
              <p className="text-xs text-red-700 mt-1">
                This action requires admin password verification to prevent accidental payment reversal.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            if (showPasswordField) {
              setShowPasswordField(false);
              setAdminPassword("");
            } else {
              setOpen(false);
            }
          }}
          className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5"
        >
          {showPasswordField ? "Back" : "Cancel"}
        </button>
        <button
          type="submit"
          className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5"
        >
          {showPasswordField ? "Verify & Reverse Payment" : "Reverse Payment"}
        </button>
      </div>
    </form>
  );
};

export default DeleteStudentFeeForm;
