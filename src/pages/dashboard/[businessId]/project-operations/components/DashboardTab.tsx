import React, { useMemo } from "react";
import {
  Briefcase,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { useBusinessData } from "@/components/dashboard/business-data-provider";

export default function DashboardTab({ businessId }: { businessId: string }) {
  const { business } = useBusinessData();

  const { running, completed, delayed, pendingTasks, totalRevenue, totalProfit, upcomingMilestones } = useMemo(() => {
    const projects = Array.isArray((business as any)?.projects) ? (business as any).projects : [];
    const invoices = Array.isArray((business as any)?.invoices) ? (business as any).invoices : [];
    
    let running = 0;
    let completed = 0;
    let delayed = 0;
    let pendingTasks = 0;
    let upcomingMilestones: any[] = [];

    projects.forEach((p: any) => {
      if (p.status === 'ACTIVE' || p.status === 'Active') running++;
      if (p.status === 'COMPLETED' || p.status === 'Completed') completed++;
      if (p.status === 'DELAYED' || p.status === 'Delayed') delayed++;
      
      const tasks = Array.isArray(p.tasks) ? p.tasks : [];
      tasks.forEach((t: any) => {
        if (t.status !== 'COMPLETED' && t.status !== 'Completed') {
          pendingTasks++;
        }
      });

      const milestones = Array.isArray(p.milestones) ? p.milestones : [];
      milestones.forEach((m: any) => {
        if (m.status !== 'COMPLETED' && m.status !== 'Completed' && m.dueDate) {
          upcomingMilestones.push({ ...m, projectName: p.name || p.projectCode });
        }
      });
    });

    upcomingMilestones = upcomingMilestones
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + Number(inv.grandTotal || 0), 0);
    const totalProfit = totalRevenue * 0.25; // Simple estimation if actual cost data isn't joined

    return { running, completed, delayed, pendingTasks, totalRevenue, totalProfit, upcomingMilestones };
  }, [business]);

  const stats = [
    {
      title: "Running Projects",
      value: running.toString(),
      icon: Briefcase,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Completed",
      value: completed.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Delayed",
      value: delayed.toString(),
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-100",
    },
    {
      title: "Pending Tasks",
      value: pendingTasks.toString(),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4"
            >
              <div className={`p-4 rounded-full ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span className="font-medium">Total Revenue</span>
              </div>
              <span className="font-bold text-lg">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <span className="font-medium">Expected Profit</span>
              </div>
              <span className="font-bold text-lg">${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Upcoming Milestones</h3>
          <div className="space-y-3">
            {upcomingMilestones.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p>No upcoming milestones found.</p>
              </div>
            ) : (
              upcomingMilestones.map((m: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-900 rounded-r-lg"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {m.title || 'Milestone'} - {m.projectName}
                    </p>
                    <p className="text-xs text-gray-500">Due: {new Date(m.dueDate).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                    {m.status || 'PENDING'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
