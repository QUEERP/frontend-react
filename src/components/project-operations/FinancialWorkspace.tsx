import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart, Activity, Wallet, FileText, ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react';

export function FinancialWorkspace({ project }: { project: any }) {
  // Use real backend auto-calculated data
  const {
    budget = 0,
    actualCost = 0,
    committedCost = 0,
    laborCost = 0,
    materialCost = 0,
    revenue = 0,
    invoicedRevenue = 0,
    collectedRevenue = 0,
  } = project;

  // Real-time calculated fields
  const totalCost = actualCost + committedCost;
  const budgetVariance = budget - totalCost;
  const budgetUtilization = budget > 0 ? (totalCost / budget) * 100 : 0;
  
  const expectedProfit = revenue - totalCost;
  const grossMargin = revenue > 0 ? (expectedProfit / revenue) * 100 : 0;
  
  const pendingRevenue = revenue - invoicedRevenue;
  const pendingCollection = invoicedRevenue - collectedRevenue;

  return (
    <div className="flex flex-col h-full space-y-6 overflow-y-auto pb-6">
      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Budget KPI */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${budgetVariance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {budgetVariance >= 0 ? 'Under Budget' : 'Over Budget'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Approved Budget</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">${budget.toLocaleString()}</h3>
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1.5">
                <div className={`h-1.5 rounded-full ${budgetUtilization > 100 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(budgetUtilization, 100)}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 font-medium">{budgetUtilization.toFixed(1)}% Utilized</p>
            </div>
          </div>
        </div>

        {/* Cost KPI */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 dark:bg-orange-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Cost (Actual + Committed)</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">${totalCost.toLocaleString()}</h3>
            <div className="flex items-center gap-4 mt-3">
               <div>
                  <p className="text-xs text-gray-400">Actual</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">${actualCost.toLocaleString()}</p>
               </div>
               <div>
                  <p className="text-xs text-gray-400">Committed</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">${committedCost.toLocaleString()}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Revenue KPI */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 text-green-600 dark:bg-green-900/30 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Contract Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">${revenue.toLocaleString()}</h3>
            <div className="flex items-center gap-4 mt-3">
               <div>
                  <p className="text-xs text-gray-400">Invoiced</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">${invoicedRevenue.toLocaleString()}</p>
               </div>
               <div>
                  <p className="text-xs text-gray-400">Unbilled</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">${pendingRevenue.toLocaleString()}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Profit KPI */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 dark:bg-purple-900/30 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
              {grossMargin.toFixed(1)}% Margin
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Forecast Net Profit</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">${expectedProfit.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 font-medium mt-3">Based on Actual + Committed Costs</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-gray-400" /> Cost Breakdown Engine
          </h3>
          
          <div className="space-y-5">
            <div>
               <div className="flex justify-between items-end mb-2">
                 <div>
                   <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Labor Cost</p>
                   <p className="text-xs text-gray-500">Auto-synced from Timesheets</p>
                 </div>
                 <p className="text-sm font-bold">${laborCost.toLocaleString()}</p>
               </div>
               <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                 <div className="bg-blue-500 h-2 rounded-full" style={{ width: totalCost > 0 ? `${(laborCost/totalCost)*100}%` : '0%' }}></div>
               </div>
            </div>

            <div>
               <div className="flex justify-between items-end mb-2">
                 <div>
                   <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Material Cost</p>
                   <p className="text-xs text-gray-500">Auto-synced from GRN & Inventory</p>
                 </div>
                 <p className="text-sm font-bold">${materialCost.toLocaleString()}</p>
               </div>
               <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                 <div className="bg-orange-500 h-2 rounded-full" style={{ width: totalCost > 0 ? `${(materialCost/totalCost)*100}%` : '0%' }}></div>
               </div>
            </div>

            <div>
               <div className="flex justify-between items-end mb-2">
                 <div>
                   <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Other Overhead</p>
                   <p className="text-xs text-gray-500">General project expenses</p>
                 </div>
                 <p className="text-sm font-bold">${Math.max(actualCost - laborCost - materialCost, 0).toLocaleString()}</p>
               </div>
               <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                 <div className="bg-gray-400 h-2 rounded-full" style={{ width: totalCost > 0 ? `${(Math.max(actualCost - laborCost - materialCost, 0)/totalCost)*100}%` : '0%' }}></div>
               </div>
            </div>
          </div>
        </div>

        {/* Cash Flow Engine */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-gray-400" /> Cash Flow Engine
          </h3>

          <div className="space-y-6">
             <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-green-100 text-green-700 rounded-md">
                      <ArrowDownRight className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Actual Cash Inflow</p>
                      <p className="text-xs text-gray-500">Collected from Invoices</p>
                   </div>
                </div>
                <p className="text-lg font-bold text-green-600">+${collectedRevenue.toLocaleString()}</p>
             </div>

             <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-red-100 text-red-700 rounded-md">
                      <ArrowUpRight className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Actual Cash Outflow</p>
                      <p className="text-xs text-gray-500">Paid Expenses & Vendor Bills</p>
                   </div>
                </div>
                <p className="text-lg font-bold text-red-600">-${actualCost.toLocaleString()}</p>
             </div>

             <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-yellow-100 text-yellow-700 rounded-md">
                      <FileText className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Pending Collections</p>
                      <p className="text-xs text-gray-500">Invoiced but unpaid</p>
                   </div>
                </div>
                <p className="text-lg font-bold text-yellow-600">${pendingCollection.toLocaleString()}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
