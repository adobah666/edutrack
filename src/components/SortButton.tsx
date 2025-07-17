"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface SortButtonProps {
  currentSort: string;
}

const SortButton = ({ currentSort }: SortButtonProps) => {
  const router = useRouter();

  const handleSort = () => {
    const url = new URL(window.location.href);
    const newSort = currentSort === 'asc' ? 'desc' : 'asc';
    url.searchParams.set('sort', newSort);
    
    // Keep on the same page when sorting
    const currentPage = url.searchParams.get('page');
    if (currentPage) {
      url.searchParams.set('page', currentPage);
    }
    
    router.push(url.toString().replace(window.location.origin, ''));
  };

  return (
    <button
      className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"
      title={currentSort === 'asc' ? 'Sorting Low to High' : 'Sorting High to Low'}
      onClick={handleSort}
    >
      <Image
        src={currentSort === 'asc' ? "/sort.png" : "/sort-desc.png"}
        alt="Sort"
        width={14}
        height={14}
      />
    </button>
  );
};

export default SortButton;