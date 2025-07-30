"use client";

import { useState } from "react";
import { UseFormRegister, FieldError } from "react-hook-form";

interface PasswordInputProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  defaultValue?: string;
  onGeneratePassword?: () => void;
  showGenerateButton?: boolean;
  className?: string;
}

const PasswordInput = ({
  label,
  name,
  register,
  error,
  defaultValue,
  onGeneratePassword,
  showGenerateButton = false,
  className = "w-full md:w-1/2"
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-xs text-gray-500">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showPassword ? "text" : "password"}
            {...register(name)}
            defaultValue={defaultValue}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5C16.478 5 20.268 7.943 21.542 12C20.268 16.057 16.478 19 12 19C7.523 19 3.732 16.057 2.458 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
        {showGenerateButton && onGeneratePassword && (
          <button
            type="button"
            onClick={onGeneratePassword}
            className="bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 text-sm whitespace-nowrap"
            title="Generate password automatically"
          >
            🔐 Generate
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400">
          {error.message?.toString()}
        </p>
      )}
    </div>
  );
};

export default PasswordInput;