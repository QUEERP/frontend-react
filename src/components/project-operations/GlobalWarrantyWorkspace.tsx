import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ShieldCheck, ShieldAlert, CheckSquare, Plus, FileSpreadsheet, FileText } from 'lucide-react';
import { projectOperationsAPI } from '@/lib/api/project-operations';
import { StatusBadge } from './StatusBadge';
import { toast } from 'sonner';

export function GlobalWarrantyWorkspace({ businessId }: { businessId: string }) {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    projectId: '',
    customerId: '',
    equipment: '',
    serialNumber: '',
    manufacturer: '',
    warrantyProvider: '',
    warrantyType: 'STANDARD',
    startDate: '',
    endDate: '',
    coverageDetails: '',
    status: 'ACTIVE',
    notes: ''
  });

  const [formProjects, setFormProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [warRes, custRes] = await Promise.all([
        projectOperationsAPI.getWarranties(businessId),
        projectOperationsAPI.getCustomers(businessId).catch(() => ({ customers: [] }))
      ]);
      setWarranties(warRes.warranties || []);
      setCustomers(custRes.customers || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [businessId]);

  useEffect(() => {
    if (formData.customerId) {
      setLoadingProjects(true);
      setFormProjects([]);
      projectOperationsAPI.getProjects(businessId, formData.customerId)
        .then(res => setFormProjects(res.projects || []))
        .catch(() => {})
        .finally(() => setLoadingProjects(false));
    } else {
      setFormProjects([]);
      setFormData(prev => ({ ...prev, projectId: '' }));
    }
  }, [formData.customerId, businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.equipment || !formData.startDate || !formData.endDate) {
      toast.error('Please fill required fields');
      return;
    }
    try {
      await projectOperationsAPI.createWarranty(businessId, formData);
      toast.success('Warranty created successfully');
      setShowForm(false);
      setFormData({...formData, customerId: '', projectId: '', equipment: '', serialNumber: '', manufacturer: '', warrantyProvider: '', warrantyType: 'STANDARD', startDate: '', endDate: '', coverageDetails: '', status: 'ACTIVE', notes: ''});
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create warranty');
    }
  };

  const filteredData = useMemo(() => {
    return warranties.filter(w => 
      (w.warrantyNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (w.project?.projectName || '').toLowerCase().includes(search.toLowerCase()) ||
      (w.equipment || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [warranties, search]);

  const now = new Date();
  const activeCount = warranties.filter(w => new Date(w.endDate) > now && w.status !== 'EXPIRED').length;
  const expiredCount = warranties.filter(w => new Date(w.endDate) <= now || w.status === 'EXPIRED').length;
  const expiring30Count = warranties.filter(w => {
    const end = new Date(w.endDate);
    const diff = (end.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diff > 0 && diff <= 30 && w.status !== 'EXPIRED';
  }).length;

  if (showForm) {
    return (
      <div className="p-6 h-full flex flex-col overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">New Warranty</h2>
          <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancel</button>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-6 flex-1">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer <span className="text-red-500">*</span></label>
              <select className="w-full p-2 border rounded-lg" value={formData.customerId} onChange={e => {
                setFormData({...formData, customerId: e.target.value, projectId: ''});
              }} required>
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Project</label>
              <select className="w-full p-2 border rounded-lg disabled:bg-gray-100" value={formData.projectId} onChange={e => {
                setFormData({...formData, projectId: e.target.value});
              }} disabled={!formData.customerId || loadingProjects}>
                <option value="">{loadingProjects ? 'Loading projects...' : (formProjects.length === 0 ? (formData.customerId ? 'No Projects Found' : 'Select Customer First') : 'Select Project')}</option>
                {formProjects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Equipment <span className="text-red-500">*</span></label>
              <input type="text" className="w-full p-2 border rounded-lg" value={formData.equipment} onChange={e => setFormData({...formData, equipment: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Serial Number</label>
              <input type="text" className="w-full p-2 border rounded-lg" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Manufacturer</label>
              <input type="text" className="w-full p-2 border rounded-lg" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Warranty Type</label>
              <select className="w-full p-2 border rounded-lg" value={formData.warrantyType} onChange={e => setFormData({...formData, warrantyType: e.target.value})}>
                <option value="STANDARD">Standard</option>
                <option value="EXTENDED">Extended</option>
                <option value="COMPREHENSIVE">Comprehensive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date <span className="text-red-500">*</span></label>
              <input type="date" className="w-full p-2 border rounded-lg" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date <span className="text-red-500">*</span></label>
              <input type="date" className="w-full p-2 border rounded-lg" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Coverage Details</label>
              <textarea className="w-full p-2 border rounded-lg" rows={3} value={formData.coverageDetails} onChange={e => setFormData({...formData, coverageDetails: e.target.value})}></textarea>
            </div>
            <div className="col-span-2 text-right">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Warranty</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 rounded-lg"><ShieldCheck className="w-5 h-5" /></div>
          <div><p className="text-xs font-semibold uppercase text-gray-500">Active Warranties</p><h3 className="text-xl font-bold">{activeCount}</h3></div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg"><ShieldAlert className="w-5 h-5" /></div>
          <div><p className="text-xs font-semibold uppercase text-gray-500">Expired</p><h3 className="text-xl font-bold">{expiredCount}</h3></div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><CheckSquare className="w-5 h-5" /></div>
          <div><p className="text-xs font-semibold uppercase text-gray-500">Expiring in 30 Days</p><h3 className="text-xl font-bold">{expiring30Count}</h3></div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search warranties..." className="pl-9 pr-4 py-2 border rounded-lg w-80 outline-none" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-lg text-sm flex gap-2 items-center"><FileSpreadsheet className="w-4 h-4" /> Excel</button>
          <button className="px-4 py-2 border rounded-lg text-sm flex gap-2 items-center"><FileText className="w-4 h-4" /> PDF</button>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex gap-2 items-center"><Plus className="w-4 h-4" /> New Warranty</button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b sticky top-0">
              <tr>
                <th className="px-6 py-4">Warranty No</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Equipment</th>
                <th className="px-6 py-4">Start Date</th>
                <th className="px-6 py-4">End Date</th>
                <th className="px-6 py-4">Remaining</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center">No warranties found.</td></tr>
              ) : filteredData.map(w => {
                const remainingDays = Math.ceil((new Date(w.endDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
                const isExpired = remainingDays <= 0 || w.status === 'EXPIRED';
                return (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{w.warrantyNumber}</td>
                    <td className="px-6 py-4">{w.project?.projectName || '-'}</td>
                    <td className="px-6 py-4">{w.equipment}</td>
                    <td className="px-6 py-4">{new Date(w.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{new Date(w.endDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {isExpired ? <span className="text-red-500 font-medium">Expired</span> : <span>{remainingDays} days</span>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={isExpired ? 'EXPIRED' : w.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
