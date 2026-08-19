import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  subtext?: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  textClass: string;
  children?: React.ReactNode;
}

export function KpiCard({
  title,
  value,
  subtext,
  icon: Icon,
  colorClass,
  bgClass,
  textClass,
  children
}: KpiCardProps) {
  return (
    <Card className={`border-l-4 ${colorClass} shadow-sm hover:shadow-md transition-shadow`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${bgClass} ${textClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        {children ? (
          children
        ) : (
          <>
            <div 
              className={`text-xl lg:text-2xl font-extrabold text-foreground tracking-tight break-all sm:break-words ${textClass === 'text-foreground' ? '' : textClass}`}
              title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
            >
              {value}
            </div>
            {subtext && (
              <p className="text-xs text-muted-foreground mt-1 font-medium">{subtext}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
