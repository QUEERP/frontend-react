import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, FileSpreadsheet, FileText, CheckCircle, Clock, AlertTriangle, UserPlus } from 'lucide-react';
import { projectOperationsAPI } from '@/lib/api/project-operations';
import { StatusBadge } from './StatusBadge';
import { toast } from 'sonner';
import { CreateCustomerModal } from '@/components/dashboard/create-customer-modal';

export function GlobalAMCWorkspace({ businessId }: { businessId: string }) {
  const [amcs, setAmcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    projectId: '',
    customerId: '',
    warrantyId: '',
    contractValue: '',
    amcType: 'COMPREHENSIVE',
    visitFrequency: 'QUARTERLY',
    startDate: '',
    endDate: '',
    assignedEngineerId: '',
    coverage: '',
    status: 'ACTIVE',
    notes: ''
  });

  const [formProjects, setFormProjects] = useState<any[]>([]);
  const [formWarranties, setFormWarranties] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingWarranties, setLoadingWarranties] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [amcRes, custRes, empRes] = await Promise.all([
        projectOperationsAPI.getAMCs(businessId),
        projectOperationsAPI.getCustomers(businessId).catch(() => ({ customers: [] })),
        projectOperationsAPI.getEmployees(businessId).catch(() => ({ employees: [] }))
      ]);
      setAmcs(amcRes.amcs || []);
      setCustomers(custRes.customers || []);
      setEmployees(empRes.employees || []);
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
      setLoadingWarranties(true);
      
      setFormProjects([]);
      setFormWarranties([]);
      
      projectOperationsAPI.getProjects(businessId, formData.customerId).then(res => setFormProjects(res.projects || [])).catch(()=>{}).finally(() => setLoadingProjects(false));
      projectOperationsAPI.getWarranties(businessId, formData.customerId).then(res => setFormWarranties(res.warranties || [])).catch(()=>{}).finally(() => setLoadingWarranties(false));
    } else {
      setFormProjects([]);
      setFormWarranties([]);
      setFormData(prev => ({ ...prev, projectId: '', warrantyId: '' }));
    }
  }, [formData.customerId, businessId]);

  useEffect(() => {
    if (formData.projectId) {
      setLoadingWarranties(true);
      projectOperationsAPI.getWarranties(businessId, formData.customerId, formData.projectId).then(res => setFormWarranties(res.warranties || [])).catch(()=>{}).finally(() => setLoadingWarranties(false));
    } else if (formData.customerId) {
      setLoadingWarranties(true);
      projectOperationsAPI.getWarranties(businessId, formData.customerId).then(res => setFormWarranties(res.warranties || [])).catch(()=>{}).finally(() => setLoadingWarranties(false));
    }
  }, [formData.projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.contractValue || !formData.startDate || !formData.endDate) {
      toast.error('Please fill required fields');
      return;
    }
    try {
      await projectOperationsAPI.createAMC(businessId, formData);
      toast.success('AMC created successfully');
      setShowForm(false);
      setFormData({...formData, customerId: '', projectId: '', warrantyId: '', contractValue: '', amcType: 'COMPREHENSIVE', visitFrequency: 'QUARTERLY', startDate: '', endDate: '', assignedEngineerId: '', coverage: '', status: 'ACTIVE', notes: ''});
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create AMC');
    }
  };

  const filteredData = useMemo(() => {
    return amcs.filter(a => 
      (a.amcNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.project?.projectName || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.customer?.company || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [amcs, search]);

  const engineerRoles = ['engineer', 'support', 'technician', 'admin'];
  const activeEngineers = employees.filter(e => {
    const desig = (e.designation || '').toLowerCase();
    return engineerRoles.some(r => desig.includes(r));
  });

  const totalRevenue = amcs.filter(a => a.status === 'ACTIVE').reduce((sum, a) => sum + (a.contractValue || 0), 0);
  const activeCount = amcs.filter(a => a.status === 'ACTIVE').length;
  
  const now = new Date();
  const pendingRenewalCount = amcs.filter(a => {
    const end = new Date(a.endDate);
    const diff = (end.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diff > 0 && diff <= 30 && a.status === 'ACTIVE';
  }).length;

  if (showForm) {
    return (
      <div className="p-6 h-full flex flex-col overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">New AMC</h2>
          <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
        </div>
        <div className="bg-white rounded-xl border p-6 flex-1">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Customer <span className="text-red-500">*</span></label>
                <button type="button" onClick={() => setShowCreateCustomer(true)} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                  <UserPlus className="w-3 h-3" /> Create Customer
                </button>
              </div>
              <select className="w-full p-2 border rounded-lg" value={formData.customerId} onChange={e => {
                setFormData({...formData, customerId: e.target.value, projectId: '', warrantyId: ''});
              }} required>
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.company || c.name || c.email || c.id}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Project</label>
              <select className="w-full p-2 border rounded-lg disabled:bg-gray-100" value={formData.projectId} onChange={e => {
                setFormData({...formData, projectId: e.target.value, warrantyId: ''});
              }} disabled={!formData.customerId || loadingProjects}>
                <option value="">{loadingProjects ? 'Loading projects...' : (formProjects.length === 0 ? (formData.customerId ? 'No Projects Found' : 'Select Customer First') : 'Select Project')}</option>
                {formProjects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Linked Warranty</label>
              <select className="w-full p-2 border rounded-lg disabled:bg-gray-100" value={formData.warrantyId} onChange={e => setFormData({...formData, warrantyId: e.target.value})} disabled={!formData.customerId || loadingWarranties}>
                <option value="">{loadingWarranties ? 'Loading warranties...' : (formWarranties.length === 0 ? (formData.customerId ? 'No Warranties Found' : 'Select Customer First') : 'No Linked Warranty')}</option>
                {formWarranties.map(w => <option key={w.id} value={w.id}>{w.warrantyNumber} - {w.equipment}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contract Value <span className="text-red-500">*</span></label>
              <input type="number" className="w-full p-2 border rounded-lg" value={formData.contractValue} onChange={e => setFormData({...formData, contractValue: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">AMC Type</label>
              <select className="w-full p-2 border rounded-lg" value={formData.amcType} onChange={e => setFormData({...formData, amcType: e.target.value})}>
                <option value="COMPREHENSIVE">Comprehensive</option>
                <option value="NON-COMPREHENSIVE">Non-Comprehensive</option>
                <option value="LABOR-ONLY">Labor Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Visit Frequency</label>
              <select className="w-full p-2 border rounded-lg" value={formData.visitFrequency} onChange={e => setFormData({...formData, visitFrequency: e.target.value})}>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="BIANNUALLY">Biannually</option>
                <option value="ANNUALLY">Annually</option>
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
            <div>
              <label className="block text-sm font-medium mb-1">Assigned Engineer</label>
              <select className="w-full p-2 border rounded-lg" value={formData.assignedEngineerId} onChange={e => setFormData({...formData, assignedEngineerId: e.target.value})}>
                <option value="">Unassigned</option>
                {activeEngineers.length > 0 ? activeEngineers.map(e => <option key={e.id} value={e.id}>{e.name || e.firstName} ({e.designation || 'Engineer'})</option>) : employees.map(e => <option key={e.id} value={e.id}>{e.name || e.firstName}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Coverage Details</label>
              <textarea className="w-full p-2 border rounded-lg" rows={3} value={formData.coverage} onChange={e => setFormData({...formData, coverage: e.target.value})}></textarea>
            </div>
            <div className="col-span-2 text-right">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Save AMC</button>
            </div>
          </form>
        </div>
        <CreateCustomerModal
          open={showCreateCustomer}
          onClose={() => setShowCreateCustomer(false)}
          businessId={businessId}
          onCreated={(newCust: any) => {
            setCustomers(prev => [...prev, newCust]);
            setFormData(prev => ({
              ...prev,
              customerId: newCust.id,
              projectId: '',
              warrantyId: ''
            }));
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="bg-white p-4 rounded-xl border flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Clock className="w-5 h-5" /></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase">Total Revenue</p><h3 className="text-xl font-bold">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3></div>
        </div>
        <div className="bg-white p-4 rounded-xl border flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle className="w-5 h-5" /></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase">Active AMCs</p><h3 className="text-xl font-bold">{activeCount}</h3></div>
        </div>
        <div className="bg-white p-4 rounded-xl border flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase">Pending Renewal</p><h3 className="text-xl font-bold">{pendingRenewalCount}</h3></div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search AMC..." className="pl-9 pr-4 py-2 border rounded-lg w-80" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-lg text-sm flex gap-2 items-center"><FileSpreadsheet className="w-4 h-4" /> Excel</button>
          <button className="px-4 py-2 border rounded-lg text-sm flex gap-2 items-center"><FileText className="w-4 h-4" /> PDF</button>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex gap-2 items-center"><Plus className="w-4 h-4" /> New AMC</button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b sticky top-0">
              <tr>
                <th className="px-6 py-4">AMC No</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Start Date</th>
                <th className="px-6 py-4">End Date</th>
                <th className="px-6 py-4">Engineer</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center">No records found.</td></tr>
              ) : filteredData.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{a.amcNumber}</td>
                  <td className="px-6 py-4">{a.customer?.company || '-'}</td>
                  <td className="px-6 py-4">${(a.contractValue || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">{new Date(a.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{new Date(a.endDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{a.assignedEngineer?.name || '-'}</td>
                  <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
