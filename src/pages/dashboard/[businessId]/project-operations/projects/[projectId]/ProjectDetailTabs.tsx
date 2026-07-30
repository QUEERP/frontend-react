import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, Map, CheckSquare, Flag, Users, Calendar, 
  FileText, Clock, Receipt, Package, ShoppingCart, DollarSign, 
  AlertCircle, ShieldAlert, GitPullRequest, HeadphonesIcon, 
  BarChart, Activity
} from 'lucide-react';
import { useBusinessData } from '@/components/dashboard/business-data-provider';

export default function ProjectDetailTabs({ project, businessId }: { project: any, businessId: string }) {
  const [activeTab, setActiveTab] = useState("overview");
  const { business } = useBusinessData();

  // Determine which tabs to show based on Execution Type
  const tabs = useMemo(() => {
    const isService = project.executionType === "SERVICE" || project.executionType === "HYBRID";
    const isProduct = project.executionType === "PRODUCT" || project.executionType === "HYBRID";
    const isConstruction = project.executionType === "CONSTRUCTION" || business?.businessType?.toLowerCase() === 'construction';

    const allTabs = [
      { id: "overview", label: "Overview", icon: LayoutDashboard, show: true },
      { id: "planning", label: "Planning", icon: Map, show: !isConstruction },
      { id: "tasks", label: "Tasks", icon: CheckSquare, show: !isConstruction && (isService || isProduct) },
      { id: "milestones", label: "Milestones", icon: Flag, show: !isConstruction && isService },
      { id: "resources", label: "Resources", icon: Users, show: !isConstruction },
      { id: "meetings", label: "Meetings", icon: Calendar, show: !isConstruction && isService },
      { id: "documents", label: "Documents", icon: FileText, show: !isConstruction },
      { id: "time-tracking", label: "Time Tracking", icon: Clock, show: !isConstruction && isService },
      { id: "expenses", label: "Expenses", icon: Receipt, show: !isConstruction },
      { id: "inventory", label: "Inventory", icon: Package, show: !isConstruction && isProduct },
      { id: "purchase", label: "Purchase", icon: ShoppingCart, show: !isConstruction && isProduct },
      { id: "billing", label: "Billing", icon: DollarSign, show: !isConstruction },
      { id: "issues", label: "Issues", icon: AlertCircle, show: !isConstruction },
      { id: "risks", label: "Risks", icon: ShieldAlert, show: !isConstruction },
      { id: "change-requests", label: "Change Requests", icon: GitPullRequest, show: !isConstruction && isService },
      { id: "support", label: "Support", icon: HeadphonesIcon, show: !isConstruction },
      { id: "reports", label: "Reports", icon: BarChart, show: !isConstruction },
      { id: "timeline", label: "Activity Timeline", icon: Activity, show: !isConstruction },
    ];

    return allTabs.filter(t => t.show);
  }, [project.executionType, business?.businessType]);

  return (
    <div>
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-5 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-blue-50/50 dark:bg-gray-700/50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>
      
      <div className="p-6 min-h-[400px]">
        {/* Placeholder for specific tab content */}
        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 py-12">
          {(() => {
            const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon;
            return ActiveIcon ? <ActiveIcon className="w-12 h-12 text-gray-300" /> : null;
          })()}
          <h3 className="text-lg font-medium">{tabs.find(t => t.id === activeTab)?.label} Dashboard</h3>
          <p className="text-sm max-w-md text-center">
            The {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} module is properly isolated based on this project's 
            <span className="font-bold text-gray-700 dark:text-gray-300 ml-1"> {project.executionType} </span> execution mode.
          </p>
        </div>
      </div>
    </div>
  );
}
