import React from 'react';
import { ShieldAlert } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComplianceBadgeProps {
  tasks: Array<{ rule: { description: string } }>;
}

export function ComplianceBadge({ tasks }: ComplianceBadgeProps) {
  if (!tasks || tasks.length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 ml-2 animate-pulse">
            <ShieldAlert className="w-3 h-3" />
            {tasks.length} Action{tasks.length > 1 ? 's' : ''} Required
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-red-900 border-red-800 text-red-50">
          <ul className="list-disc pl-4 text-xs space-y-1">
            {tasks.map((task, i) => (
              <li key={i}>{task.rule?.description || "Missing required field"}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
