'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export default function FeesFilter({
  classes,
  feeTypes,
}: {
  classes: { id: number; name: string }[];
  feeTypes: { id: number; name: string }[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const classId = searchParams.get('classId') ?? '';
  const feeTypeId = searchParams.get('feeTypeId') ?? '';
  const sortBy = searchParams.get('sortBy') ?? '';

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  return (
    <div className="flex items-center gap-2">
      <select
        name="classId"
        className="p-2 border rounded-md text-sm"
        value={classId}
        onChange={(e) => {
          replace(`${pathname}?${createQueryString('classId', e.target.value)}`);
        }}
      >
        <option value="">All Classes</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        name="feeTypeId"
        className="p-2 border rounded-md text-sm"
        value={feeTypeId}
        onChange={(e) => {
          replace(`${pathname}?${createQueryString('feeTypeId', e.target.value)}`);
        }}
      >
        <option value="">All Fee Types</option>
        {feeTypes.map((ft) => (
          <option key={ft.id} value={ft.id}>
            {ft.name}
          </option>
        ))}
      </select>

      <select
        name="sortBy"
        className="p-2 border rounded-md text-sm"
        value={sortBy}
        onChange={(e) => {
          replace(`${pathname}?${createQueryString('sortBy', e.target.value)}`);
        }}
      >
        <option value="">Sort by</option>
        <option value="dueDate_asc">Due Date (Earliest)</option>
        <option value="dueDate_desc">Due Date (Latest)</option>
        <option value="amount_asc">Amount (Low-High)</option>
        <option value="amount_desc">Amount (High-Low)</option>
      </select>
    </div>
  );
}
