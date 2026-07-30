import { useParams } from 'react-router-dom';
import React, { use, useMemo } from "react";
import { 
  Briefcase, CheckCircle, Clock, AlertTriangle, 
  DollarSign, TrendingUp, Wallet, Users, LineChart
} from "lucide-react";
import { useBusinessData } from "@/components/dashboard/business-data-provider";

export default function ProjectOperationsDashboard() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  
  const { business } = useBusinessData();
  
  const { running, completed, delayed, pendingTasks, totalBudget, totalRevenue, totalProfit, utilization } = useMemo(() => {
    const projects = Array.isArray((business as any)?.projects) ? (business as any).projects : [];
    const invoices = Array.isArray((business as any)?.invoices) ? (business as any).invoices : [];
    const expenses = Array.isArray((business as any)?.expenses) ? (business as any).expenses : [];
    const allEmployees = Array.isArray((business as any)?.employees) ? (business as any).employees : [];
    
    let running = 0;
    let completed = 0;
    let delayed = 0;
    let pendingTasks = 0;
    let totalBudget = 0;

    projects.forEach((p: any) => {
      if (p.status === 'ACTIVE' || p.status === 'Active') running++;
      if (p.status === 'COMPLETED' || p.status === 'Completed') completed++;
      if (p.status === 'DELAYED' || p.status === 'Delayed') delayed++;
      
      totalBudget += Number(p.budget || 0);

      const tasks = Array.isArray(p.tasks) ? p.tasks : [];
      tasks.forEach((t: any) => {
        if (t.status !== 'COMPLETED' && t.status !== 'Completed') {
          pendingTasks++;
        }
      });
    });

    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + Number(inv.grandTotal || 0), 0);
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0);
    const totalProfit = totalRevenue - totalExpenses;
    
    // Utilization approximation: if we have active projects, utilization goes up based on active employees.
    // If no real time logs exist, we can show 0% if no projects.
    const utilization = running > 0 && allEmployees.length > 0 
      ? Math.min(100, Math.round((running / allEmployees.length) * 100))
      : 0;

    return { running, completed, delayed, pendingTasks, totalBudget, totalRevenue, totalProfit, utilization };
  }, [business]);

  const statCards = [
    { title: "Running Projects", value: running.toString(), icon: Briefcase, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { title: "Completed Projects", value: completed.toString(), icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
    { title: "Delayed Projects", value: delayed.toString(), icon: Clock, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
    { title: "Pending Tasks", value: pendingTasks.toString(), icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
  ];

  const formatCurrency = (val: number) => {
    if (val === 0) return '0';
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  const financialCards = [
    { title: "Total Budget", value: formatCurrency(totalBudget), icon: Wallet, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
    { title: "Recognized Revenue", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { title: "Expected Profit", value: formatCurrency(totalProfit), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { title: "Employee Utilization", value: `${utilization}%`, icon: Users, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Project Operations Dashboard
          </h1>
          <p className="text-sm text-gray-500">Enterprise Overview</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-80 flex flex-col items-center justify-center">
          <LineChart className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">No data available</p>
          <p className="text-gray-500 text-sm mt-1">Insufficient budget data to generate chart</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-80 flex flex-col items-center justify-center">
          <LineChart className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">No data available</p>
          <p className="text-gray-500 text-sm mt-1">Insufficient project timeline data to generate chart</p>
        </div>
      </div>
    </div>
  );
}
