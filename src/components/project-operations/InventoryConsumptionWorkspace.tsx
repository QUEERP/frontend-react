import React from 'react';
import { Package, Search, Plus, Filter, ArrowDownRight, Warehouse, QrCode } from 'lucide-react';
import { StatusBadge } from '@/components/project-operations/StatusBadge';

export function InventoryConsumptionWorkspace({ project }: { project: any }) {
  const inventoryLogs = [
    { id: 'INV-001', item: 'Cat6 Ethernet Cable', sku: 'CBL-CAT6-100', quantity: 5, unit: 'Rolls', warehouse: 'Main Hub', consumedBy: 'Mike Ross', date: '2023-10-25', cost: 1250 },
    { id: 'INV-002', item: 'Cisco Router ASR', sku: 'RTR-CIS-992', quantity: 2, unit: 'Pieces', warehouse: 'Site B', consumedBy: 'Alex Chen', date: '2023-10-26', cost: 4500 },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search consumed materials..." 
              className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-transparent rounded-lg text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
          <ArrowDownRight className="w-4 h-4" /> Consume Material
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-2">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-700 dark:bg-purple-900/30 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Consumed</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">7 Items</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 dark:bg-green-900/30 rounded-lg">
            <DollarSignIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Material Cost</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">$5,750</h3>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-4">Item Details</th>
              <th className="px-6 py-4">Quantity</th>
              <th className="px-6 py-4">Warehouse</th>
              <th className="px-6 py-4">Consumed By</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Cost Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {inventoryLogs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <QrCode className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{log.item}</p>
                      <p className="text-xs text-gray-500 font-mono">{log.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                  {log.quantity} <span className="text-xs font-normal text-gray-500">{log.unit}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-sm"><Warehouse className="w-3.5 h-3.5 text-gray-400" /> {log.warehouse}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium">{log.consumedBy}</span>
                </td>
                <td className="px-6 py-4 text-xs">
                  {log.date}
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-red-600">-${log.cost.toLocaleString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Need to import missing icon locally
import { DollarSign as DollarSignIcon } from 'lucide-react';
