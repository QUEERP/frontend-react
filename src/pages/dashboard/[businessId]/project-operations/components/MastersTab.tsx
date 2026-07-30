import React from "react";
import { Tag, Flag, Layers, Clock, ShieldAlert } from "lucide-react";

export default function MastersTab({ businessId }: { businessId: string }) {
  const categories = [
    { name: "Project Types", icon: Layers, count: 5 },
    { name: "Categories", icon: Tag, count: 8 },
    { name: "Task Status", icon: Clock, count: 4 },
    { name: "Priorities", icon: Flag, count: 3 },
    { name: "Issue Types", icon: ShieldAlert, count: 6 },
  ];

  return (
    <div className="flex gap-6">
      <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 pr-4 space-y-1">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <button
              key={i}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-colors ${i === 0 ? "bg-blue-50 text-blue-700 dark:bg-gray-700 dark:text-blue-400 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                {cat.name}
              </div>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            Project Types
          </h3>
          <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
            Add Type
          </button>
        </div>
        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium w-24">Status</th>
                <th className="px-6 py-3 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {["Internal", "Client Delivery", "Maintenance", "Research"].map(
                (type, i) => (
                  <tr
                    key={i}
                    className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 font-medium">{type}</td>
                    <td className="px-6 py-4 text-gray-500">
                      Standard project workflow
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:underline">
                        Edit
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
