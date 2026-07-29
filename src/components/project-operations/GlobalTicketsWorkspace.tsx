import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, FileSpreadsheet, FileText, CheckCircle, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { projectOperationsAPI } from '@/lib/api/project-operations';
import { StatusBadge } from './StatusBadge';
import { toast } from 'sonner';

export function GlobalTicketsWorkspace({ businessId }: { businessId: string }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [amcs, setAmcs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    projectId: '',
    customerId: '',
    warrantyId: '',
    amcId: '',
    subject: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    assignedEngineerId: '',
    expectedResolution: '',
    status: 'OPEN'
  });

  const [formProjects, setFormProjects] = useState<any[]>([]);
  const [formWarranties, setFormWarranties] = useState<any[]>([]);
  const [formAmcs, setFormAmcs] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingWarranties, setLoadingWarranties] = useState(false);
  const [loadingAmcs, setLoadingAmcs] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tktRes, custRes, empRes] = await Promise.all([
        projectOperationsAPI.getTickets(businessId),
        projectOperationsAPI.getCustomers(businessId).catch(() => ({ customers: [] })),
        projectOperationsAPI.getEmployees(businessId).catch(() => ({ employees: [] }))
      ]);
      setTickets(tktRes.tickets || []);
      setCustomers(custRes.customers || []);
      setEmployees(empRes.employees || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load tickets');
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
      setLoadingAmcs(true);
      
      setFormProjects([]);
      setFormWarranties([]);
      setFormAmcs([]);
      
      projectOperationsAPI.getProjects(businessId, formData.customerId).then(res => setFormProjects(res.projects || [])).catch(()=>{}).finally(() => setLoadingProjects(false));
      projectOperationsAPI.getWarranties(businessId, formData.customerId).then(res => setFormWarranties(res.warranties || [])).catch(()=>{}).finally(() => setLoadingWarranties(false));
      projectOperationsAPI.getAMCs(businessId, formData.customerId).then(res => setFormAmcs(res.amcs || [])).catch(()=>{}).finally(() => setLoadingAmcs(false));
    } else {
      setFormProjects([]);
      setFormWarranties([]);
      setFormAmcs([]);
      setFormData(prev => ({ ...prev, projectId: '', warrantyId: '', amcId: '' }));
    }
  }, [formData.customerId, businessId]);

  useEffect(() => {
    if (formData.projectId) {
      setLoadingWarranties(true);
      setLoadingAmcs(true);
      
      projectOperationsAPI.getWarranties(businessId, formData.customerId, formData.projectId).then(res => setFormWarranties(res.warranties || [])).catch(()=>{}).finally(() => setLoadingWarranties(false));
      projectOperationsAPI.getAMCs(businessId, formData.customerId, formData.projectId).then(res => setFormAmcs(res.amcs || [])).catch(()=>{}).finally(() => setLoadingAmcs(false));
    } else if (formData.customerId) {
      setLoadingWarranties(true);
      setLoadingAmcs(true);
      projectOperationsAPI.getWarranties(businessId, formData.customerId).then(res => setFormWarranties(res.warranties || [])).catch(()=>{}).finally(() => setLoadingWarranties(false));
      projectOperationsAPI.getAMCs(businessId, formData.customerId).then(res => setFormAmcs(res.amcs || [])).catch(()=>{}).finally(() => setLoadingAmcs(false));
    }
  }, [formData.projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.subject || !formData.description) {
      toast.error('Please fill required fields');
      return;
    }
    try {
      await projectOperationsAPI.createTicket(businessId, formData);
      toast.success('Ticket created successfully');
      setShowForm(false);
      setFormData({...formData, customerId: '', projectId: '', warrantyId: '', amcId: '', subject: '', description: '', category: '', priority: 'MEDIUM', assignedEngineerId: '', expectedResolution: '', status: 'OPEN'});
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create Ticket');
    }
  };

  const filteredData = useMemo(() => {
    return tickets.filter(t => 
      (t.ticketNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.customer?.company || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [tickets, search]);

  const engineerRoles = ['engineer', 'support', 'technician', 'admin'];
  const activeEngineers = employees.filter(e => {
    const desig = (e.designation || '').toLowerCase();
    return engineerRoles.some(r => desig.includes(r));
  });

  const openCount = tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;
  const closedCount = tickets.filter(t => t.status === 'CLOSED' || t.status === 'RESOLVED').length;
  const highPriorityCount = tickets.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL').length;
  const overdueCount = tickets.filter(t => {
    if (!t.expectedResolution || t.status === 'RESOLVED' || t.status === 'CLOSED') return false;
    return new Date(t.expectedResolution).getTime() < new Date().getTime();
  }).length;

  if (showForm) {
    return (
      <div className="p-6 h-full flex flex-col overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">New Support Ticket</h2>
          <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
        </div>
        <div className="bg-white rounded-xl border p-6 flex-1">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer <span className="text-red-500">*</span></label>
              <select className="w-full p-2 border rounded-lg" value={formData.customerId} onChange={e => {
                setFormData({...formData, customerId: e.target.value, projectId: '', warrantyId: '', amcId: ''});
              }} required>
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Project</label>
              <select className="w-full p-2 border rounded-lg disabled:bg-gray-100" value={formData.projectId} onChange={e => {
                setFormData({...formData, projectId: e.target.value, warrantyId: '', amcId: ''});
              }} disabled={!formData.customerId || loadingProjects}>
                <option value="">{loadingProjects ? 'Loading projects...' : (formProjects.length === 0 ? (formData.customerId ? 'No Projects Found' : 'Select Customer First') : 'Select Project')}</option>
                {formProjects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Linked AMC</label>
              <select className="w-full p-2 border rounded-lg disabled:bg-gray-100" value={formData.amcId} onChange={e => setFormData({...formData, amcId: e.target.value})} disabled={!formData.customerId || loadingAmcs}>
                <option value="">{loadingAmcs ? 'Loading AMCs...' : (formAmcs.length === 0 ? (formData.customerId ? 'No AMCs Found' : 'Select Customer First') : 'No Linked AMC')}</option>
                {formAmcs.map(a => <option key={a.id} value={a.id}>{a.amcNumber}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Linked Warranty</label>
              <select className="w-full p-2 border rounded-lg disabled:bg-gray-100" value={formData.warrantyId} onChange={e => setFormData({...formData, warrantyId: e.target.value})} disabled={!formData.customerId || loadingWarranties}>
                <option value="">{loadingWarranties ? 'Loading warranties...' : (formWarranties.length === 0 ? (formData.customerId ? 'No Warranties Found' : 'Select Customer First') : 'No Linked Warranty')}</option>
                {formWarranties.map(w => <option key={w.id} value={w.id}>{w.warrantyNumber}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Subject <span className="text-red-500">*</span></label>
              <input type="text" className="w-full p-2 border rounded-lg" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input type="text" className="w-full p-2 border rounded-lg" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select className="w-full p-2 border rounded-lg" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expected Resolution</label>
              <input type="datetime-local" className="w-full p-2 border rounded-lg" value={formData.expectedResolution} onChange={e => setFormData({...formData, expectedResolution: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assigned Engineer</label>
              <select className="w-full p-2 border rounded-lg" value={formData.assignedEngineerId} onChange={e => setFormData({...formData, assignedEngineerId: e.target.value})}>
                <option value="">Unassigned</option>
                {activeEngineers.length > 0 ? activeEngineers.map(e => <option key={e.id} value={e.id}>{e.name || e.firstName} ({e.designation || 'Engineer'})</option>) : employees.map(e => <option key={e.id} value={e.id}>{e.name || e.firstName}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description <span className="text-red-500">*</span></label>
              <textarea className="w-full p-2 border rounded-lg" rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required></textarea>
            </div>
            <div className="col-span-2 text-right">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Save Ticket</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4 p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        <div className="bg-white p-4 rounded-xl border flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Clock className="w-5 h-5" /></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase">Open Tickets</p><h3 className="text-xl font-bold">{openCount}</h3></div>
        </div>
        <div className="bg-white p-4 rounded-xl border flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle className="w-5 h-5" /></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase">Closed Tickets</p><h3 className="text-xl font-bold">{closedCount}</h3></div>
        </div>
        <div className="bg-white p-4 rounded-xl border flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase">High Priority</p><h3 className="text-xl font-bold">{highPriorityCount}</h3></div>
        </div>
        <div className="bg-white p-4 rounded-xl border flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertCircle className="w-5 h-5" /></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase">Overdue</p><h3 className="text-xl font-bold">{overdueCount}</h3></div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search Tickets..." className="pl-9 pr-4 py-2 border rounded-lg w-80" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-lg text-sm flex gap-2 items-center"><FileSpreadsheet className="w-4 h-4" /> Excel</button>
          <button className="px-4 py-2 border rounded-lg text-sm flex gap-2 items-center"><FileText className="w-4 h-4" /> PDF</button>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex gap-2 items-center"><Plus className="w-4 h-4" /> New Ticket</button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b sticky top-0">
              <tr>
                <th className="px-6 py-4">Ticket No</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Engineer</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center">No tickets found.</td></tr>
              ) : filteredData.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{t.ticketNumber}</td>
                  <td className="px-6 py-4">{t.customer?.company || '-'}</td>
                  <td className="px-6 py-4">{t.subject}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${t.priority === 'CRITICAL' || t.priority === 'HIGH' ? 'bg-red-100 text-red-700' : t.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">{t.assignedEngineer?.name || '-'}</td>
                  <td className="px-6 py-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
