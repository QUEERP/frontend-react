import React from "react";

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercent?: boolean;
  colorClass?: string;
}

export function ProgressBar({ progress, label, showPercent = true, colorClass = "bg-blue-600" }: ProgressBarProps) {
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>}
          {showPercent && <span className="text-xs font-semibold text-gray-900 dark:text-white">{safeProgress}%</span>}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden flex">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${colorClass}`} 
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
}
