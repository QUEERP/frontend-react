import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import {  useParams, useNavigate  } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, Clock, CheckCircle2, AlertCircle, Plus, 
  Download, FileText, LayoutGrid, X, Check, XCircle, SlidersHorizontal, UserX, UserCheck, PlayCircle, Eye, Edit, Trash2, ShieldAlert, Flag, Activity, GitPullRequest
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { API_ROOT } from "@/config/api";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  'PENDING APPROVAL': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'UNDER REVIEW': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  HIGH: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  MEDIUM: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  LOW: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
};

export function GlobalChangeRequestsWorkspace({ businessId: propBusinessId }: { businessId?: string }) {
  const navigate = useNavigate();
  const params = useParams();
  const businessId = (propBusinessId || params?.businessId) as string;
  const { toast } = useToast();
  
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
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
      const API = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '');
      const token = localStorage.getItem('token') || '';
      const h = { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId };
      
      const [crRes, empRes, projRes] = await Promise.all([
        fetch(`${API}/api/project-operations/global/change-requests`, { headers: h }).catch(() => ({ json: () => ({}) })),
        fetch(`${API}/api/user-management`, { headers: h }).catch(() => ({ json: () => ({}) })),
        fetch(`${API}/api/project-operations`, { headers: h }).catch(() => ({ json: () => ({}) })),
      ]);
      
      let crData:any, empData:any, projData:any;
      const [crDataRes, empDataRes, projDataRes] = await Promise.all([
        crRes.json?.() || crData, empRes.json?.() || empData, projRes.json?.() || projData
      ]);
      
      setChangeRequests(crData?.changeRequests || crData?.data || []);
      setEmployees(empData?.users || empData?.data || empData?.employees || []);
      setProjects(projData?.projects || projData?.data || []);
      
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load change requests", variant: "destructive" });
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
      
                        
      const queryParams = new URLSearchParams();
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (filters.project) queryParams.append('projectId', filters.project);
      if (filters.customer) queryParams.append('customerId', filters.customer);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.impact) queryParams.append('impact', filters.impact);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.approvalStatus) queryParams.append('approvalStatus', filters.approvalStatus);

      const url = `${API_ROOT}/project-operations/change-requests/export/${type}?${queryParams.toString()}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId }
      });

      if (!res.ok) throw new Error(`Export failed with status ${res.status}`);

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `ChangeRequests_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast({ title: "Success", description: `${type.toUpperCase()} downloaded successfully.` });
    } catch (err: any) {
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsExportingExcel(false);
      setIsExportingPDF(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const updated = { ...prev };
      if (!value) delete updated[key];
      else updated[key] = value;
      return updated;
    });
    setCurrentPage(1);
  };

  const clearFilters = () => { setFilters({}); setSearch(''); setDebouncedSearch(''); setCurrentPage(1); };

  const filteredData = useMemo(() => {
    return changeRequests.filter(cr => {
      let m = true;
      const s = debouncedSearch.toLowerCase();
      if (s) {
        m = m && (
          cr.requestNumber?.toLowerCase().includes(s) ||
          cr.title?.toLowerCase().includes(s) ||
          cr.project?.projectName?.toLowerCase().includes(s) ||
          cr.project?.customer?.name?.toLowerCase().includes(s) ||
          cr.requestedBy?.name?.toLowerCase().includes(s) ||
          cr.assignedTo?.name?.toLowerCase().includes(s)
        );
      }
      if (filters.project) m = m && cr.projectId === filters.project;
      if (filters.customer) m = m && cr.project?.customerId === filters.customer;
      if (filters.priority) m = m && cr.priority?.toUpperCase() === filters.priority;
      if (filters.impact) m = m && cr.impact?.toUpperCase() === filters.impact;
      if (filters.status) m = m && cr.status?.toUpperCase() === filters.status;
      if (filters.approvalStatus) m = m && cr.approvalStatus?.toUpperCase() === filters.approvalStatus;
      return m;
    });
  }, [changeRequests, debouncedSearch, filters]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const kpis = {
    total: changeRequests.length,
    pending: changeRequests.filter(r => (r.approvalStatus || '').toUpperCase() === 'PENDING APPROVAL').length,
    approved: changeRequests.filter(r => (r.approvalStatus || '').toUpperCase() === 'APPROVED').length,
    rejected: changeRequests.filter(r => (r.approvalStatus || '').toUpperCase() === 'REJECTED').length,
    inReview: changeRequests.filter(r => (r.approvalStatus || '').toUpperCase() === 'UNDER REVIEW').length,
    completed: changeRequests.filter(r => (r.status || '').toUpperCase() === 'COMPLETED').length,
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 relative">
      <div className="flex-none px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <span>Project Operations</span>
                <span>/</span>
                <span className="text-blue-600 dark:text-blue-400">Change Requests</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Change Requests</h1>
              <p className="text-sm text-gray-500 mt-1">Manage, review, approve and track project change requests across all projects.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleBackendExport('excel')}
              disabled={isExportingExcel || loading}
              className="flex items-center gap-2 px-4 py-2 border border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
            >
              <FileText className="w-4 h-4" />
              {isExportingExcel ? 'Exporting...' : 'Excel'}
            </button>
            <button 
              onClick={() => handleBackendExport('pdf')}
              disabled={isExportingPDF || loading}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <Download className="w-4 h-4" />
              {isExportingPDF ? 'Exporting...' : 'PDF'}
            </button>
            <button 
              onClick={() => navigate(`/dashboard/${businessId}/project-operations/change-requests/create`)}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Change Request
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center flex-shrink-0">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Requests</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{kpis.total}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Approval</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{kpis.pending}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approved</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{kpis.approved}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rejected</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{kpis.rejected}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 flex items-center justify-center flex-shrink-0">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In Review</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{kpis.inReview}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{kpis.completed}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Request No, Title, Project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto justify-center ${
                  Object.keys(filters).length > 0 || isFilterOpen
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {Object.keys(filters).length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-xs font-bold">
                    {Object.keys(filters).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {isFilterOpen && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Project</label>
                <select value={filters.project || ''} onChange={(e) => handleFilterChange('project', e.target.value)} className="p-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500">
                  <option value="">All Projects</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Priority</label>
                <select value={filters.priority || ''} onChange={(e) => handleFilterChange('priority', e.target.value)} className="p-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500">
                  <option value="">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Approval Status</label>
                <select value={filters.approvalStatus || ''} onChange={(e) => handleFilterChange('approvalStatus', e.target.value)} className="p-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500">
                  <option value="">All Approval Statuses</option>
                  <option value="PENDING APPROVAL">Pending Approval</option>
                  <option value="UNDER REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <button onClick={clearFilters} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-x-auto relative">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-[11px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4">Request No.</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Project / Customer</th>
                  <th className="px-6 py-4">Requested By</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Priority / Impact</th>
                  <th className="px-6 py-4">Status / Approval</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse bg-white dark:bg-gray-900">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                      <td className="px-6 py-4 text-right"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto"></div></td>
                    </tr>
                  ))
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                          <GitPullRequest className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Change Requests Found</h3>
                        <p className="text-sm text-gray-500 max-w-sm mb-6">There are no change requests matching your current filters. Adjust your search criteria or create a new request.</p>
                        <button onClick={() => navigate(`/dashboard/${businessId}/project-operations/change-requests/create`)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-2">
                          <Plus className="w-4 h-4" /> New Change Request
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map(cr => (
                    <tr key={cr.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <GitPullRequest className="w-4 h-4 text-blue-500" />
                          <span className="font-bold text-gray-900 dark:text-white">{cr.requestNumber || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{cr.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]">{cr.project?.projectName || '-'}</span>
                          <span className="text-xs text-gray-500 truncate max-w-[150px]">{cr.project?.customer?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                            {(cr.requestedBy?.name?.[0] || cr.requestedBy?.firstName?.[0] || '?').toUpperCase()}
                          </div>
                          <span className="font-medium">{cr.requestedBy?.name || cr.requestedBy?.firstName || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {cr.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center text-[10px] font-bold">
                              {(cr.assignedTo?.name?.[0] || cr.assignedTo?.firstName?.[0] || '?').toUpperCase()}
                            </div>
                            <span className="font-medium">{cr.assignedTo?.name || cr.assignedTo?.firstName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                           <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${PRIORITY_COLORS[cr.priority?.toUpperCase()] || PRIORITY_COLORS.LOW}`}>
                             {cr.priority || 'LOW'}
                           </span>
                           <span className="text-xs text-gray-500">Impact: <span className="font-semibold text-gray-700 dark:text-gray-300">{cr.impact || '-'}</span></span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1.5 items-start">
                           <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${STATUS_COLORS[cr.approvalStatus?.toUpperCase()] || STATUS_COLORS.DRAFT}`}>
                             {cr.approvalStatus || 'PENDING'}
                           </span>
                           <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">ST: {cr.status}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col text-xs gap-1 text-gray-500">
                           <span><span className="font-semibold text-gray-700 dark:text-gray-300">Req:</span> {cr.createdAt ? new Date(cr.createdAt).toLocaleDateString() : '-'}</span>
                           <span><span className="font-semibold text-gray-700 dark:text-gray-300">Upd:</span> {cr.updatedAt ? new Date(cr.updatedAt).toLocaleDateString() : '-'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                          <button className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                          <button className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
                          <button className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors" title="Reject"><XCircle className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {!loading && filteredData.length > pageSize && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">Previous</button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage * pageSize >= filteredData.length} className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
