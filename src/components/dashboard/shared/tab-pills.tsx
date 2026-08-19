import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface TabItem {
  value: string;
  label: string;
}

export interface TabPillsProps {
  tabs: TabItem[];
}

export function TabPills({ tabs }: TabPillsProps) {
  return (
    <TabsList className="bg-slate-100/50 p-1 flex-wrap h-auto justify-start">
      {tabs.map((tab) => (
        <TabsTrigger 
          key={tab.value}
          value={tab.value} 
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
