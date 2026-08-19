import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CornerDownRight } from 'lucide-react';

export interface FunnelStage {
  name: string;
  count: number;
  value: React.ReactNode;
  conversionPercent?: number; // Optional for the first stage
}

export interface FunnelBranch {
  name: string;
  count: number;
  value: React.ReactNode;
  note?: string;
}

export interface LifecycleFunnelProps {
  title: string;
  description?: string;
  stages: FunnelStage[];
  branches?: FunnelBranch[];
}

export function LifecycleFunnel({ title, description, stages, branches = [] }: LifecycleFunnelProps) {
  return (
    <Card className="border-0 shadow-sm col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        {/* Main Chain */}
        <div className="flex flex-col md:flex-row items-stretch gap-2 mb-6">
          {stages.map((stage, index) => (
            <React.Fragment key={stage.name}>
              {/* Stage Card */}
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col relative">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  {stage.name}
                </span>
                <div className="text-2xl font-extrabold text-foreground mb-1">{stage.count}</div>
                <div className="text-sm font-medium text-emerald-600 dark:text-emerald-500">
                  {stage.value}
                </div>
                {index > 0 && typeof stage.conversionPercent === 'number' && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-medium text-slate-500">
                      {stage.conversionPercent}% conv.
                    </span>
                  </div>
                )}
              </div>
              
              {/* Arrow (hidden on very small screens, visible on md+) */}
              {index < stages.length - 1 && (
                <div className="hidden md:flex items-center justify-center px-1">
                  <ArrowRight className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Branches */}
        {branches.length > 0 && (
          <div className="pl-4 md:pl-10">
            <div className="flex items-center gap-2 mb-3">
              <CornerDownRight className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Related Activity
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
              {branches.map((branch) => (
                <div key={branch.name} className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800 shadow-sm border-l-2 border-l-slate-400">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-foreground">{branch.name}</span>
                    <span className="text-xs font-bold text-foreground">{branch.count}</span>
                  </div>
                  <div className="text-sm font-medium text-emerald-600 dark:text-emerald-500">
                    {branch.value}
                  </div>
                  {branch.note && (
                    <p className="text-[10px] text-muted-foreground mt-1">{branch.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
