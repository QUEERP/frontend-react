import React from 'react';

export interface StatusPillProps {
  status: string;
}

export function StatusPill({ status }: StatusPillProps) {
  const normalizedStatus = status.toUpperCase();
  
  let colorClass = 'bg-slate-100 text-slate-700'; // Default gray

  if (['PAID', 'COMPLETED', 'CONVERTED', 'ACCEPTED', 'ACTIVE', 'APPROVED', 'FULLY_RECEIVED'].includes(normalizedStatus)) {
    colorClass = 'bg-emerald-100 text-emerald-700'; // Green
  } else if (['PENDING', 'PARTIAL', 'SENT'].includes(normalizedStatus)) {
    colorClass = 'bg-amber-100 text-amber-700'; // Amber
  } else if (['CANCELLED', 'OVERDUE', 'REJECTED', 'VOID'].includes(normalizedStatus)) {
    colorClass = 'bg-rose-100 text-rose-700'; // Red
  }

  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colorClass}`}>
      {status}
    </span>
  );
}
