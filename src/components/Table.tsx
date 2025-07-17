"use client";

import { useSearchParams } from 'next/navigation';
import { ReactNode, isValidElement } from 'react';

export type TableColumn = {
  header: string;
  accessor: string;
  className?: string;
};

type TableProps<T> = {
  columns: TableColumn[];
  data: T[];
  emptyMessage?: string;
  renderCustomRow?: (item: T) => JSX.Element;
};

const Table = <T extends { id: string | number }>({
  columns,
  data,
  emptyMessage,
  renderCustomRow,
}: TableProps<T>) => {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search');

  if (data.length === 0) {
    return (
      <div className="w-full mt-4 p-8 flex items-center justify-center">
        <p className="text-gray-500 text-sm">
          {searchTerm 
            ? `No results found for "${searchTerm}"`
            : (emptyMessage || "No data found")}
        </p>
      </div>
    );
  }

  const renderCell = (item: T, accessor: string): ReactNode => {
    const value = item[accessor as keyof T];
    if (value === null || value === undefined) return '';
    
    // Handle ReactNode values directly
    if (isValidElement(value)) {
      return value;
    }
    
    // Handle other types by converting to string
    return String(value);
  };

  return (
    <table className="w-full mt-4">
      <thead>
        <tr className="text-left text-gray-500 text-sm">
          {columns.map((col) => (
            <th key={col.accessor} className={`p-4 ${col.className || ''}`}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => 
          renderCustomRow ? (
            renderCustomRow(item)
          ) : (
            <tr 
              key={item.id}
              className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
            >
              {columns.map((col) => (
                <td key={col.accessor} className={`p-4 ${col.className || ''}`}>
                  {renderCell(item, col.accessor)}
                </td>
              ))}
            </tr>
          )
        )}
      </tbody>
    </table>
  );
};

export default Table;
