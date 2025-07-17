"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect } from "react";

type TableSearchProps = {
  placeholder?: string;
};

const TableSearch = ({ placeholder = "Search..." }: TableSearchProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = (e.currentTarget[0] as HTMLInputElement).value;

    setLocalLoading(true);
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      router.push(`${window.location.pathname}?${params}`);
    });
  };

  // Effect to reset local loading when transition completes
  useEffect(() => {
    if (!isPending) {
      setLocalLoading(false);
    }
  }, [isPending]);

  return (
    <div className="relative w-full md:w-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2"
      >
        {(isPending || localLoading) ? (
          <div className="animate-spin w-[14px] h-[14px] rounded-full border-2 border-gray-300 border-t-lamaPurple" />
        ) : (
          <Image src="/search.png" alt="" width={14} height={14} />
        )}
        <input
          type="text"
          placeholder={placeholder}
          defaultValue={searchParams.get("search") || ""}
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </form>
    </div>
  );
};

export default TableSearch;
