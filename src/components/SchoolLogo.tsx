"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type SchoolInfo = {
  name: string;
  logo?: string;
};

const SchoolLogo = ({ className }: { className?: string }) => {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        const response = await fetch("/api/school");
        if (response.ok) {
          const data = await response.json();
          setSchoolInfo(data);
        }
      } catch (error) {
        console.error("Error fetching school info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolInfo();
  }, []);

  if (loading) {
    return (
      <Link href="/" className={`flex items-center gap-2 ${className || ""}`}>
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
        <span className="font-bold text-gray-400">Loading...</span>
      </Link>
    );
  }

  return (
    <Link href="/" className={`flex items-center gap-2 ${className || ""}`}>
      <Image 
        src={schoolInfo?.logo || "/logo.png"} 
        alt="School Logo" 
        width={32} 
        height={32}
        className="rounded"
      />
      <span className="font-bold">
        {schoolInfo?.name || "School Management"}
      </span>
    </Link>
  );
};

export default SchoolLogo;