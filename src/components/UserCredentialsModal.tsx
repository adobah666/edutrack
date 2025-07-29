"use client";

import { useState } from "react";
import { toast } from "react-toastify";

interface UserCredentialsModalProps {
  userId: string;
  userType: "parent" | "student";
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Credentials {
  username: string;
  password: string;
  name: string;
  surname: string;
  email?: string;
  phone?: string;
}

const UserCredentialsModal = ({
  userId,
  userType,
  userName,
  isOpen,
  onClose,
}: UserCredentialsModalProps) => {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/get-user-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          userType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch credentials");
      }

      const data = await response.json();
      setCredentials(data.credentials);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      toast.error("Failed to fetch login credentials");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const copyAllCredentials = () => {
    if (!credentials) return;
    
    const credentialsText = `Login Credentials for ${credentials.name} ${credentials.surname}:
Username: ${credentials.username}
Password: ${credentials.password}
${credentials.email ? `Email: ${credentials.email}` : ''}
${credentials.phone ? `Phone: ${credentials.phone}` : ''}`;
    
    copyToClipboard(credentialsText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Login Credentials - {userName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {!credentials ? (
          <div className="text-center">
            <p className="mb-4 text-gray-600">
              Click below to retrieve the login credentials for this {userType}.
            </p>
            <button
              onClick={fetchCredentials}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              {loading ? "Loading..." : "Get Credentials"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Username:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-white px-2 py-1 rounded">
                      {credentials.username}
                    </span>
                    <button
                      onClick={() => copyToClipboard(credentials.username)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-white px-2 py-1 rounded">
                      {credentials.password}
                    </span>
                    <button
                      onClick={() => copyToClipboard(credentials.password)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {credentials.email && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Email:</span>
                    <span className="text-sm">{credentials.email}</span>
                  </div>
                )}

                {credentials.phone && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Phone:</span>
                    <span className="text-sm">{credentials.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyAllCredentials}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Copy All
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Share these credentials securely with the {userType} so they can log in to the system.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCredentialsModal;