import React from "react";
import { Plus, Search, FileText } from "lucide-react";

export default function EstimationsTab({ businessId }: { businessId: string }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search estimations..."
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-64 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Estimation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Est-{i}4291
                  </h3>
                  <p className="text-xs text-gray-500">Linked to REQ-0000{i}</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">
                Draft
              </span>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Material</span>
                <span>$45,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Labour</span>
                <span>$12,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Margin (15%)</span>
                <span>$8,550</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t mt-2">
                <span>Total</span>
                <span>$65,550</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                Edit
              </button>
              <button className="flex-1 py-2 text-sm bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400">
                Convert to Quote
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
