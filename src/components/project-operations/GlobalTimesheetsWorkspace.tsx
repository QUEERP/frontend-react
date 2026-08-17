import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import {  useParams, useNavigate  } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, Clock, CheckCircle2, AlertCircle, Plus, 
  Download, FileText, LayoutGrid, X, Check, XCircle, SlidersHorizontal, UserX, UserCheck, PlayCircle, Eye, Edit, Trash2, ShieldAlert
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { API_ROOT } from "@/config/api";

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PENDING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function GlobalTimesheetsWorkspace({ businessId: propBusinessId }: { businessId?: string }) {
  const navigate = useNavigate();
  const params = useParams();
  const businessId = (propBusinessId || params?.businessId) as string;
  const { toast } = useToast();
  
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  
  // Pagination
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  const fetchData = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const API = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const token = localStorage.getItem('token') || '';
      const h = { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId };
      
      const [tsRes, empRes, projRes] = await Promise.all([
        fetch(`${API}/api/time-entries`, { headers: h }).catch(() => ({ json: () => ({}) })),
        fetch(`${API}/api/employees`, { headers: h }).catch(() => ({ json: () => ({}) })),
        fetch(`${API}/api/projects`, { headers: h }).catch(() => ({ json: () => ({}) })),
      ]);
      
      const [tsData, empData, projData] = await Promise.all([
        tsRes.json ? tsRes.json() : ({} as any), 
        empRes.json ? empRes.json() : ({} as any), 
        projRes.json ? projRes.json() : ({} as any)
      ]);
      
      setTimesheets((tsData as any)?.entries || (tsData as any)?.data || []);
      setEmployees((empData as any)?.users || (empData as any)?.data || (empData as any)?.employees || []);
      setProjects((projData as any)?.projects || (projData as any)?.data || []);
      
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load timesheets", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [businessId]);

  const handleBackendExport = async (type: 'excel' | 'pdf') => {
    try {
      if (type === 'excel') setIsExportingExcel(true);
      else setIsExportingPDF(true);

      toast({ title: `Generating ${type.toUpperCase()}`, description: "Please wait..." });
      
      let token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      if (!token) token = document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token') || localStorage.getItem('accessToken') || undefined;
      }
      
                        
      const res = await fetch(`${API_ROOT}/timesheets/export/${type}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId }
      });
      
      if (!res.ok) throw new Error(`Failed to export ${type.toUpperCase()}`);
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Timesheets_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Success", description: `${type.toUpperCase()} downloaded successfully.` });
    } catch (error: any) {
      toast({ title: "Export Error", description: error.message || "Failed to generate report", variant: "destructive" });
    } finally {
      setIsExportingExcel(false);
      setIsExportingPDF(false);
    }
  };

  const filtered = useMemo(() => {
    const s = debouncedSearch.toLowerCase();
    return timesheets.filter(t => {
      const empName = (t.employee?.name || t.employee?.firstName || '').toLowerCase();
      const projName = (t.project?.projectName || '').toLowerCase();
      const taskName = (t.task?.title || '').toLowerCase();
      
      if (s && !empName.includes(s) && !projName.includes(s) && !taskName.includes(s)) return false;
      
      if (filters.status && t.status !== filters.status) return false;
      if (filters.project && t.projectId !== filters.project) return false;
      if (filters.employee && t.employeeId !== filters.employee) return false;
      if (filters.billable) {
        const isBill = filters.billable === 'true';
        if (!!t.billable !== isBill) return false;
      }
      return true;
    });
  }, [timesheets, debouncedSearch, filters]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);
  
  const totalPages = Math.ceil(filtered.length / pageSize);

  const kpis = useMemo(() => {
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    return {
      totalHours: filtered.filter(t => new Date(t.date) >= thisWeek).reduce((a, b) => a + (b.hours || 0), 0),
      approved: filtered.filter(t => t.status === 'APPROVED').reduce((a, b) => a + (b.hours || 0), 0),
      pending: filtered.filter(t => t.status === 'PENDING').reduce((a, b) => a + (b.hours || 0), 0),
      rejected: filtered.filter(t => t.status === 'REJECTED').reduce((a, b) => a + (b.hours || 0), 0),
      employees: new Set(filtered.map(t => t.employeeId)).size,
      billable: filtered.filter(t => t.billable).reduce((a, b) => a + (b.hours || 0), 0),
    };
  }, [filtered]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden relative">
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Timesheets</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review, approve and manage employee work logs across all projects.</p>
          </div>
          <div className="flex gap-3 relative">
            <button 
              onClick={() => handleBackendExport('excel')} 
              disabled={isExportingExcel || isExportingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm font-semibold border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shadow-sm disabled:opacity-50"
            >
              {isExportingExcel ? (
                <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              Excel
            </button>
            <button 
              onClick={() => handleBackendExport('pdf')} 
              disabled={isExportingExcel || isExportingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-semibold border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm disabled:opacity-50"
            >
              {isExportingPDF ? (
                <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FileText className="w-4 h-4" />
              )}
              PDF
            </button>
            <Link to={`/dashboard/${businessId || 'loading'}/project-operations/timesheets/create`} onClick={(e) => { if (!businessId) e.preventDefault(); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors">
              <Plus className="w-4 h-4" /> Log Time
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Hours (This Week)', val: kpis.totalHours.toFixed(1), color: 'text-blue-600' },
            { label: 'Approved Hours', val: kpis.approved.toFixed(1), color: 'text-emerald-600' },
            { label: 'Pending Approval', val: kpis.pending.toFixed(1), color: 'text-orange-600' },
            { label: 'Rejected Hours', val: kpis.rejected.toFixed(1), color: 'text-red-600' },
            { label: 'Active Employees', val: kpis.employees, color: 'text-purple-600' },
            { label: 'Billable Hours', val: kpis.billable.toFixed(1), color: 'text-indigo-600' },
          ].map((k, i) => (
            <div key={i} className={`bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm`}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{k.label}</p>
              <p className={`text-3xl font-black ${k.color}`}>{k.val}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee, project, task..." className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 transition-all" />
            </div>
            <button onClick={() => setIsFilterOpen(true)} className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-colors ${Object.keys(filters).length > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 hover:bg-gray-50'}`}>
              <Filter className="w-4 h-4" /> Filter {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Timesheets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-5 relative">
              <Clock className="w-10 h-10 text-blue-500" />
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 p-1.5 rounded-full border border-gray-100 dark:border-gray-800 shadow"><Plus className="w-4 h-4 text-orange-500" /></div>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{search || Object.keys(filters).length ? 'No Matching Timesheets' : 'No Timesheets Found'}</h3>
            <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{search || Object.keys(filters).length ? 'Try clearing your search or filters.' : 'Create your first time log to begin tracking hours.'}</p>
            {search || Object.keys(filters).length > 0 ? (
              <button onClick={() => { setSearch(''); setFilters({}); }} className="px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold">Clear Filters</button>
            ) : (
              <Link to={`/dashboard/${businessId || 'loading'}/project-operations/timesheets/create`} onClick={(e) => { if (!businessId) e.preventDefault(); }} className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Log Time</Link>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Project</th>
                    <th className="px-5 py-3.5">Task</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Hours</th>
                    <th className="px-5 py-3.5">Overtime</th>
                    <th className="px-5 py-3.5">Billable</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Manager</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginated.map(ts => (
                    <tr key={ts.id || ts._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {(ts.employee?.name || ts.employee?.firstName || 'U').charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{ts.employee?.name || ts.employee?.firstName || 'Unknown'}</p>
                            <p className="text-[10px] text-gray-400 truncate w-32">{ts.employee?.department || 'Department'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">{ts.project?.projectName || '-'}</p>
                        <p className="text-[10px] text-gray-500">{ts.project?.projectCode}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 text-xs truncate max-w-[150px]">{ts.task?.title || '-'}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs font-medium">
                        {ts.date ? new Date(ts.date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-black text-gray-900 dark:text-white">{ts.hours}h</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold ${ts.overtime > 0 ? 'text-red-500' : 'text-gray-400'}`}>{ts.overtime || 0}h</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${ts.billable ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
                          {ts.billable ? 'YES' : 'NO'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${STATUS_COLORS[ts.status] || STATUS_COLORS.DRAFT}`}>{(ts.status || 'DRAFT').replace('_', ' ')}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 font-medium">
                        {ts.project?.projectManager?.name || 'Unassigned'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded" title="View"><Eye className="w-4 h-4" /></button>
                          <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
                          <button className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Reject"><XCircle className="w-4 h-4" /></button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded" title="Edit"><Edit className="w-4 h-4" /></button>
                          <button className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                          <button className="p-1.5 text-purple-400 hover:text-purple-700 hover:bg-purple-50 rounded" title="Audit History"><ShieldAlert className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Rows per page:</span>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="text-xs border-gray-300 rounded p-1 bg-white outline-none">
                  {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <span className="text-xs text-gray-500">Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} records</span>
              <div className="flex items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600 disabled:opacity-50">Previous</button>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600 disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isFilterOpen && (
        <div className="absolute inset-y-0 right-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 flex flex-col transform transition-transform">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Advanced Filters</h3>
            <button onClick={() => setIsFilterOpen(false)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Status</label>
              <select value={filters.status || ''} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer">
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option><option value="SUBMITTED">Submitted</option><option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Project</label>
              <select value={filters.project || ''} onChange={e => setFilters(p => ({ ...p, project: e.target.value }))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer">
                <option value="">All Projects</option>
                {projects.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.projectName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Employee</label>
              <select value={filters.employee || ''} onChange={e => setFilters(p => ({ ...p, employee: e.target.value }))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer">
                <option value="">All Employees</option>
                {employees.map(e => <option key={e.id || e._id} value={e.id || e._id}>{e.name || e.firstName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Billable Status</label>
              <select value={filters.billable || ''} onChange={e => setFilters(p => ({ ...p, billable: e.target.value }))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer">
                <option value="">Any</option>
                <option value="true">Billable Only</option>
                <option value="false">Non-Billable Only</option>
              </select>
            </div>
          </div>
          <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex gap-3">
            <button onClick={() => setFilters({})} className="flex-1 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">Reset</button>
            <button onClick={() => setIsFilterOpen(false)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}
