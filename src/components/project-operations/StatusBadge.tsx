import React from "react";

export type StatusType = "Draft" | "Planning" | "Active" | "On Hold" | "Completed" | "Cancelled" | "Review";

interface StatusBadgeProps {
  status: StatusType | string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const getStyles = () => {
    switch ((status || "").toLowerCase()) {
      case "active":
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "planning":
      case "review":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "on hold":
      case "draft":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getSize = () => {
    switch (size) {
      case "sm": return "text-[10px] px-2 py-0.5";
      case "lg": return "text-sm px-3 py-1";
      default: return "text-xs px-2.5 py-1";
    }
  };

  return (
    <span className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full ${getStyles()} ${getSize()}`}>
      {status}
    </span>
  );
}
