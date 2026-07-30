import React from "react";
import { Plus, Search, Filter } from "lucide-react";

export default function RequirementsTab({
  businessId,
}: {
  businessId: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search requirements..."
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-64 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Requirement
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3">Req No</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Priority</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-6 py-4 font-medium text-blue-600">REQ-00001</td>
              <td className="px-6 py-4 font-medium">ERP Implementation</td>
              <td className="px-6 py-4">Acme Corp</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                  High
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                  Discussion
                </span>
              </td>
              <td className="px-6 py-4">
                <button className="text-blue-600 hover:underline">View</button>
              </td>
            </tr>
            {/* Empty State could go here if no data */}
          </tbody>
        </table>
      </div>
    </div>
  );
}
