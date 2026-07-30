import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import {  useParams, useNavigate  } from 'react-router-dom';
import { Search, Filter, Users, UserCheck, Clock, Download, FileText, ChevronDown, CheckCircle, SlidersHorizontal, X } from 'lucide-react';
import { projectOperationsAPI, Resource } from '@/lib/api/project-operations';
import { useToast } from "@/components/ui/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { API_ROOT } from "@/config/api";

export function GlobalResourcesWorkspace({ businessId: propBusinessId }: { businessId?: string }) {
  const navigate = useNavigate();
  const params = useParams();
  const { toast } = useToast();
  const businessId = (propBusinessId || params?.businessId) as string;
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    if (businessId) {
      fetchResources();
    }
  }, [businessId]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await projectOperationsAPI.getResources(businessId);
      if (data.success) {
        setResources(data.resources || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load resources.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = 
        (res.name || '').toLowerCase().includes(searchLower) ||
        (res.code || '').toLowerCase().includes(searchLower) ||
        (res.department || '').toLowerCase().includes(searchLower) ||
        (res.role || '').toLowerCase().includes(searchLower) ||
        ((res as any).projectNames || []).some((p: string) => p.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      if (filters['Department'] && res.department !== filters['Department']) return false;
      if (filters['Role'] && res.role !== filters['Role']) return false;
      if (filters['Availability'] && res.availability !== filters['Availability']) return false;
      if (filters['Project'] && !((res as any).projectNames || []).includes(filters['Project'])) return false;
      if (filters['Utilization Range']) {
        const u = res.utilization;
        if (filters['Utilization Range'] === '0-40%' && u > 40) return false;
        if (filters['Utilization Range'] === '41-80%' && (u <= 40 || u > 80)) return false;
        if (filters['Utilization Range'] === '81-100%' && (u <= 80 || u > 100)) return false;
        if (filters['Utilization Range'] === '>100%' && u <= 100) return false;
      }
      
      return true;
    });
  }, [resources, searchTerm, filters]);

  const totalResources = resources.length;
  const avgUtilization = totalResources > 0 
    ? Math.round(resources.reduce((sum, r) => sum + r.utilization, 0) / totalResources) 
    : 0;
  const overallocatedCount = resources.filter(r => r.utilization > 100).length;

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    Object.entries(filters).forEach(([k, v]) => {
      let paramKey = k.toLowerCase();
      if (k === 'Utilization Range') paramKey = 'utilizationRange';
      params.append(paramKey, v as string);
    });
    return params.toString();
  };

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
      
                        
      const qs = buildQueryString();
      const res = await fetch(`${API_ROOT}/project-operations/resources/export/${type}?${qs}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-business-id': businessId
        }
      });
      
      if (!res.ok) {
        const errorText = await res.json().catch(() => ({ message: `Failed to export ${type.toUpperCase()}` }));
        throw new Error(errorText.message || `Failed to export ${type.toUpperCase()}`);
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Resource_Planning_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
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



  return (
    <div className="flex flex-col h-full space-y-4 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/30 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
             <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Resources</p>
             <h3 className="text-xl font-bold">{totalResources}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
             <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Avg Utilization</p>
             <h3 className="text-xl font-bold">{avgUtilization}%</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-orange-50 text-orange-600 dark:bg-orange-900/30 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
             <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Overallocated</p>
             <h3 className="text-xl font-bold">{overallocatedCount}</h3>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, code, dept, role, project..."
            className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-80 transition-all outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsFilterOpen(true)} className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${Object.keys(filters).length > 0 ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <Filter className="w-4 h-4" /> Filter {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
          </button>
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
        </div>
      </div>

      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-1.5 py-1">
          {Object.entries(filters).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 px-2 py-1 rounded text-xs font-semibold border border-blue-100">
              <span>{k}: {v}</span>
              <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => {
                const newF = {...filters}; delete newF[k]; setFilters(newF);
              }}/>
            </div>
          ))}
          <button onClick={() => setFilters({})} className="text-xs text-gray-500 hover:text-gray-800 px-2 font-medium">Clear All</button>
        </div>
      )}

      <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading resources...</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 sticky top-0">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department / Designation</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Active Projects</th>
                  <th className="px-6 py-4">Utilization</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredResources.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          {r.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{r.name}</p>
                          <p className="text-xs text-gray-500">{r.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{r.department}</p>
                      <p className="text-xs text-gray-500">{r.designation}</p>
                    </td>
                    <td className="px-6 py-4">{r.role}</td>
                    <td className="px-6 py-4 font-medium">{r.projects}</td>
                    <td className="px-6 py-4">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1">
                        <div className={`h-1.5 rounded-full ${r.utilization > 100 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(r.utilization, 100)}%` }}></div>
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold">{r.utilization}% ({r.currentWorkload} hrs)</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                        r.availability === 'Overallocated' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                        r.availability === 'Underutilized' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                      }`}>
                        {r.availability}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredResources.length === 0 && !loading && (
                   <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No resources found matching the criteria.</td>
                   </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <div className="relative w-80 bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col border-l border-gray-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold flex items-center gap-2"><Filter className="w-4 h-4"/> Filters</h2>
              <button onClick={() => setIsFilterOpen(false)}><X className="w-4 h-4 text-gray-500"/></button>
            </div>
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Department</label>
                <select 
                  className="w-full p-2 border rounded text-sm"
                  onChange={(e) => e.target.value ? setFilters({...filters, 'Department': e.target.value}) : setFilters({...filters, 'Department': undefined})}
                >
                  <option value="">All Departments</option>
                  {Array.from(new Set(resources.map(r => r.department).filter(d => d && d !== '-'))).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Role</label>
                <select 
                  className="w-full p-2 border rounded text-sm"
                  onChange={(e) => e.target.value ? setFilters({...filters, 'Role': e.target.value}) : setFilters({...filters, 'Role': undefined})}
                >
                  <option value="">All Roles</option>
                  {Array.from(new Set(resources.map(r => r.role).filter(r => r && r !== '-'))).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Availability</label>
                <select 
                  className="w-full p-2 border rounded text-sm"
                  onChange={(e) => e.target.value ? setFilters({...filters, 'Availability': e.target.value}) : setFilters({...filters, 'Availability': undefined})}
                >
                  <option value="">All</option>
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Overallocated">Overallocated</option>
                  <option value="Underutilized">Underutilized</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Project</label>
                <select 
                  className="w-full p-2 border rounded text-sm"
                  onChange={(e) => e.target.value ? setFilters({...filters, 'Project': e.target.value}) : setFilters({...filters, 'Project': undefined})}
                >
                  <option value="">All Projects</option>
                  {Array.from(new Set(resources.flatMap(r => (r as any).projectNames || []))).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Utilization Range</label>
                <select 
                  className="w-full p-2 border rounded text-sm"
                  onChange={(e) => e.target.value ? setFilters({...filters, 'Utilization Range': e.target.value}) : setFilters({...filters, 'Utilization Range': undefined})}
                >
                  <option value="">All Ranges</option>
                  <option value="0-40%">0-40%</option>
                  <option value="41-80%">41-80%</option>
                  <option value="81-100%">81-100%</option>
                  <option value=">100%">&gt;100%</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
