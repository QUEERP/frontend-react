import React from "react";
import { BarChart, PieChart, Activity, Download } from "lucide-react";

export default function ReportsTab({ businessId }: { businessId: string }) {
  const reports = [
    {
      title: "Project Profitability",
      desc: "Compare estimated budget vs actual revenue and costs",
      icon: BarChart,
    },
    {
      title: "Employee Utilization",
      desc: "Track billable vs non-billable hours across the team",
      icon: Activity,
    },
    {
      title: "Task Completion",
      desc: "Analyze task velocity and delayed milestones",
      icon: PieChart,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Standard Reports
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, i) => {
          const Icon = report.icon;
          return (
            <div
              key={i}
              className="group border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-all bg-white dark:bg-gray-800 cursor-pointer hover:border-blue-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <button className="text-gray-400 hover:text-blue-600">
                  <Download className="w-5 h-5" />
                </button>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {report.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {report.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
