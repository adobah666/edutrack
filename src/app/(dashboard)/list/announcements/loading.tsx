import React from 'react';

export default function Loading() {
  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="flex items-center gap-4">
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Table Loading State */}
      <div className="mt-4">
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 rounded"></div>
          ))}
        </div>

        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-gray-100 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Loading State */}
      <div className="flex justify-between items-center mt-4">
        <div className="h-8 w-24 bg-gray-200 rounded"></div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}