import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Filter, FileText, ArrowRight, Truck, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/project-operations/StatusBadge';
import { API_ROOT } from '@/config/api';

export function ProcurementWorkspace({ project, businessId }: { project: any, businessId: string }) {
  const [activeSubTab, setActiveSubTab] = useState('requests');
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProcurementData();
  }, [project.id]);

  const fetchProcurementData = async () => {
    try {
      setLoading(true);
            const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      };

      const [reqRes, orderRes] = await Promise.all([
        fetch(`${API_ROOT}/projects/${project.id}/procurement/purchase-requests`, { headers }),
        fetch(`${API_ROOT}/projects/${project.id}/procurement/purchase-orders`, { headers })
      ]);

      const reqData = await reqRes.json();
      const orderData = await orderRes.json();

      if (reqData.success) setPurchaseRequests(reqData.requests);
      if (orderData.success) setPurchaseOrders(orderData.orders);
    } catch (error) {
      console.error("Error fetching procurement data:", error);
    } finally {
      setLoading(false);
    }
  };

  const subcontracts = project?.subcontracts || [];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Sub Navigation */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveSubTab('requests')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'requests' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}`}
          >
            Material Requests
          </button>
          <button 
            onClick={() => setActiveSubTab('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'orders' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}`}
          >
            Purchase Orders
          </button>
          <button 
            onClick={() => setActiveSubTab('subcontracts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'subcontracts' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}`}
          >
            Subcontracts
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4" /> {activeSubTab === 'requests' ? 'New Request' : activeSubTab === 'orders' ? 'Create PO' : 'Add Subcontract'}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder={`Search ${activeSubTab}...`}
              className="pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
             <div className="p-8 text-center text-gray-500">Loading procurement data...</div>
          ) : activeSubTab === 'requests' ? (
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="bg-white dark:bg-gray-900 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 sticky top-0">
                <tr>
                  <th className="px-6 py-4">Request #</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Requested By</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {purchaseRequests.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">No material requests found for this project.</td></tr>
                )}
                {purchaseRequests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{req.requestNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 font-medium">{req.requester?.user?.name || 'System'}</td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500">
                      {req.items?.length || 0} Products
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-semibold">Convert to PO</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeSubTab === 'orders' ? (
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="bg-white dark:bg-gray-900 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 sticky top-0">
                <tr>
                  <th className="px-6 py-4">PO Number</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {purchaseOrders.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">No purchase orders linked to this project.</td></tr>
                )}
                {purchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 rounded-lg">
                          <ShoppingCart className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{po.poNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={po.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 font-medium">{po.vendor?.name || 'Unknown Vendor'}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                      ${po.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(po.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {po.status === 'APPROVED' ? (
                         <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                           <Truck className="w-3.5 h-3.5" /> Pending GRN
                         </span>
                      ) : po.status === 'DELIVERED' ? (
                         <span className="text-xs text-green-600 font-medium">Received</span>
                      ) : (
                         <span className="text-xs text-gray-400">Awaiting Auth</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="bg-white dark:bg-gray-900 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 sticky top-0">
                <tr>
                  <th className="px-6 py-4">Subcontract ID</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Assigned Task</th>
                  <th className="px-6 py-4">Contract Value</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {subcontracts.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">No subcontracts linked to this project.</td></tr>
                )}
                {subcontracts.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{sub.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{sub.vendor?.companyName || 'Unknown Vendor'}</td>
                    <td className="px-6 py-4 text-sm">{sub.title || sub.task || 'General Subcontract'}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">${(sub.amount || sub.value || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status?.toUpperCase().replace(' ', '_') || 'PENDING'} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${sub.progress || 0}%` }}></div>
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold">{sub.progress || 0}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
