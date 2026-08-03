import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import {  useNavigate, useParams  } from 'react-router-dom';
import { 
  Search, Filter, MoreVertical, Layout, AlignLeft, Calendar as CalendarIcon,
  Map, CheckSquare, Flag, Users, Clock, Receipt, Package, ShoppingCart, 
  DollarSign, AlertCircle, ShieldAlert, GitPullRequest, HeadphonesIcon, 
  BarChart, Activity, Download, FileText, LayoutGrid, List, SlidersHorizontal, X, ArrowRight, Eye, Edit, Copy, Trash2, CheckCircle2, Lock, Settings
} from 'lucide-react';
import { StatusBadge } from '@/components/project-operations/StatusBadge';
import { ProgressBar } from '@/components/project-operations/ProgressBar';
import { useToast } from "@/components/ui/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useBusinessData } from '@/components/dashboard/business-data-provider';
import { ProjectsTable } from './ProjectsTable';

const TaskWorkspace = ({ project }: any) => <GenericWorkspaceTab title="Tasks" project={project} />;
const MilestoneWorkspace = ({ project }: any) => <GenericWorkspaceTab title="Milestones" project={project} />;
const IssueWorkspace = ({ project }: any) => <GenericWorkspaceTab title="Issues" project={project} />;

const GenericWorkspaceTab = ({ title, project }: any) => (
  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{title} Management</h3>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded text-xs font-bold border border-gray-200">Filter</button>
        <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-bold border border-blue-200">+ Create {title.slice(0, -1)}</button>
      </div>
    </div>
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
          <tr>
            <th className="px-6 py-4">ID</th>
            <th className="px-6 py-4">Name / Title</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
              No {title.toLowerCase()} records found for {project?.projectName}.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default function ProjectsWorkspace({ businessId: propBusinessId }: { businessId?: string }) {
  const navigate = useNavigate();
  const params = useParams();const businessId = (propBusinessId || (params as any)?.businessId) as string;
  const { toast } = useToast();
  const { business } = useBusinessData();
  const isBasic = business?.businessType?.toLowerCase() === 'basic';
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortOrder, setSortOrder] = useState('Newest First');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchProjects();
  }, [businessId]);

  const fetchProjects = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '');
      const getCookie = (name: string) => {
        if (typeof document === 'undefined') return '';
        const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : '';
      };
      let token = getCookie('token') || getCookie('accessToken');
      if (!token && typeof window !== 'undefined') {
         token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
      }
      
      const res = await fetch(`${API_BASE}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId as string },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data || data.projects)) {
        const list = data.data || data.projects;
        setProjects(list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        if (list.length > 0 && !selectedProject) setSelectedProject(list[0]);
      } else {
        toast({ title: "API Error", description: data.message || JSON.stringify(data), variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      toast({ title: "Error", description: error.message || "Failed to load projects.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(proj => {
    const searchLower = debouncedSearch.toLowerCase();
    const name = (proj.projectName || '').toLowerCase();
    const code = (proj.projectCode || '').toLowerCase();
    const cust = (proj.customer?.name || proj.customer?.company || '').toLowerCase();
    const mgr = (proj.projectManager?.name || proj.projectManager?.user?.name || '').toLowerCase();
    const stat = (proj.status || '').toLowerCase();
    
    if (searchLower && !name.includes(searchLower) && !code.includes(searchLower) && !cust.includes(searchLower) && !mgr.includes(searchLower) && !stat.includes(searchLower)) return false;
    
    if (filters['Status'] && proj.status !== filters['Status']) return false;
    if (filters['Type'] && proj.executionType !== filters['Type']) return false;
    if (filters['Priority'] && proj.priority !== filters['Priority']) return false;
    if (filters['Customer'] && proj.customerId !== filters['Customer']) return false;
    if (filters['Manager'] && proj.projectManagerId !== filters['Manager']) return false;
    if (filters['Department'] && proj.department !== filters['Department']) return false;
    
    if (filters['Budget']) {
      const b = proj.budget || 0;
      if (filters['Budget'] === 'under10k' && b >= 10000) return false;
      if (filters['Budget'] === '10k-50k' && (b < 10000 || b > 50000)) return false;
      if (filters['Budget'] === 'over50k' && b <= 50000) return false;
    }
    
    if (filters['Progress']) {
      const p = proj.completionPercentage || 0;
      if (filters['Progress'] === '0' && p !== 0) return false;
      if (filters['Progress'] === 'under50' && p >= 50) return false;
      if (filters['Progress'] === 'over50' && p < 50) return false;
      if (filters['Progress'] === '100' && p !== 100) return false;
    }
    
    return true;
  }).sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    if (sortOrder === 'Newest First') return dateB - dateA;
    if (sortOrder === 'Oldest First') return dateA - dateB;
    if (sortOrder === 'Recently Updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    
    // For Last 7/30 Days or Today, we handle it in filter if needed, but the prompt said "Recent button should support Today, Last 7 Days, Last 30 Days, Newest First, Oldest First, Recently Updated".
    // We'll treat them as filters applied alongside sort.
    return dateB - dateA; // default
  }).filter((a: any) => {
    if (sortOrder === 'Today') {
       return new Date(a.createdAt).toDateString() === new Date().toDateString();
    }
    if (sortOrder === 'Last 7 Days') {
       return new Date(a.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
    }
    if (sortOrder === 'Last 30 Days') {
       return new Date(a.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  const getHealth = (proj: any) => {
    if (proj.status === 'COMPLETED') return { color: 'bg-green-500', text: 'Healthy' };
    const progress = proj.completionPercentage || 0;
    const now = new Date().getTime();
    const end = proj.endDate ? new Date(proj.endDate).getTime() : 0;
    if (end > 0 && now > end && progress < 100) return { color: 'bg-red-500', text: 'Delayed' };
    if (progress < 20 && end > 0 && (end - now) < 86400000 * 7) return { color: 'bg-yellow-500', text: 'At Risk' };
    return { color: 'bg-green-500', text: 'Healthy' };
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
      
      const API_BASE_RAW = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').trim();
      const API_BASE = API_BASE_RAW.replace(/\/$/, '');
      const apiRoot = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;
      
      const res = await fetch(`${apiRoot}/projects/export/${type}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId as string }
      });
      
      if (!res.ok) {
        const errorText = await res.json().catch(() => ({ message: `Failed to export ${type.toUpperCase()}` }));
        throw new Error(errorText.message || `Failed to export ${type.toUpperCase()}`);
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Projects_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
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

  const tabs = useMemo(() => {
    if (!selectedProject) return [];
    return [
      { id: "overview", label: "Overview", icon: Layout },
      { id: "planning", label: "Planning", icon: Map },
      { id: "tasks", label: "Tasks", icon: CheckSquare },
      { id: "milestones", label: "Milestones", icon: Flag },
      { id: "resources", label: "Resources", icon: Users },
      { id: "budget", label: "Budget", icon: DollarSign },
      { id: "timesheets", label: "Timesheets", icon: Clock },
      { id: "documents", label: "Documents", icon: FileText },
      { id: "issues", label: "Issues", icon: AlertCircle },
      { id: "risks", label: "Risks", icon: ShieldAlert },
      { id: "meetings", label: "Meetings", icon: Users },
      { id: "invoices", label: "Invoices", icon: Receipt },
      { id: "billing", label: "Billing", icon: DollarSign },
      { id: "activities", label: "Activities", icon: Activity },
      { id: "team", label: "Team", icon: Users },
      { id: "comments", label: "Comments", icon: AlignLeft },
      { id: "timeline", label: "Timeline", icon: Activity },
      { id: "reports", label: "Reports", icon: BarChart },
      { id: "settings", label: "Settings", icon: Settings },
    ];
  }, [selectedProject]);

  if (isBasic) {
    return (
      <ProjectsTable 
        businessId={businessId as string} 
        projects={projects} 
        loading={loading} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        filteredProjects={filteredProjects} 
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-gray-50 dark:bg-gray-950">
      
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <span>Project Operations</span><span>/</span><span className="text-blue-600 dark:text-blue-400">Projects Master</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects Workspace</h1>
             <p className="text-sm text-gray-500 mt-1">Manage, execute, and monitor all enterprise projects in one place.</p>
          </div>
          <div className="flex gap-2">
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
            <button 
              onClick={() => {
                if (!businessId) return;
                navigate(`/dashboard/${businessId}/project-operations/projects/create`);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm ml-2"
            >
              + Create Project
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANE: List */}
        <div className="w-[420px] flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-full shadow-sm relative z-20">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects by code, name, customer..." 
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsFilterOpen(true)} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold border rounded-lg transition-colors ${Object.keys(filters).length > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                <Filter className="w-3.5 h-3.5" /> Filters {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
              </button>
              <div className="flex-1 relative">
                <button onClick={() => setShowSortMenu(!showSortMenu)} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold border border-gray-200 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                  <Clock className="w-3.5 h-3.5" /> Recent
                </button>
                {showSortMenu && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 overflow-hidden py-1">
                    {['Today', 'Last 7 Days', 'Last 30 Days', 'Newest First', 'Oldest First', 'Recently Updated'].map(opt => (
                      <button key={opt} onClick={() => { setSortOrder(opt); setShowSortMenu(false); }} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 ${sortOrder === opt ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin bg-gray-50 dark:bg-gray-950">
            {loading ? (
               <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
                 <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                 <span className="text-xs font-bold uppercase tracking-widest">Loading Projects...</span>
               </div>
            ) : projects.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                 <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                   <LayoutGrid className="w-10 h-10 text-gray-300" />
                 </div>
                 <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">No Projects Available</h3>
                 <p className="text-sm text-gray-500 mb-6 max-w-[250px]">Your project directory is completely empty.</p>
                 <button onClick={() => {
                   if (!businessId) return;
                   navigate(`/dashboard/${businessId}/project-operations/projects/create`);
                 }} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors">
                   Create First Project
                 </button>
               </div>
            ) : filteredProjects.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                 <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">No matching projects</h3>
                 <p className="text-xs text-gray-500 mb-4">Try adjusting your search or filters.</p>
                 <button onClick={() => { setSearchTerm(''); setFilters({}); setSortOrder('Newest First'); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Clear Filters</button>
               </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredProjects.map(proj => {
                  const health = getHealth(proj);
                  return (
                    <div 
                      key={proj.id} 
                      onClick={() => setSelectedProject(proj)}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedProject?.id === proj.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600' 
                          : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{proj.projectCode}</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${health.color}`} title={health.text}></div>
                          <StatusBadge status={proj.status} size="sm" />
                        </div>
                      </div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 mb-1 leading-tight">{proj.projectName}</h4>
                      <p className="text-xs text-gray-500 font-medium mb-3 truncate">{proj.customer?.name || proj.customer?.company || 'Internal'}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-gray-900 dark:text-white">${(proj.budget || 0).toLocaleString()}</span>
                        <span className="font-bold text-gray-400 flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" /> {proj.createdAt ? new Date(proj.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'}) : 'N/A'}
                        </span>
                      </div>
                      <div className="mt-3">
                         <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-1">
                            <span>Progress</span>
                            <span>{proj.completionPercentage || 0}%</span>
                         </div>
                         <ProgressBar progress={proj.completionPercentage || 0} showPercent={false} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Details Workspace */}
        <div className="flex-1 min-w-0 flex flex-col h-full bg-gray-50/50 dark:bg-gray-950/30 overflow-hidden relative z-10">
          {selectedProject ? (
            <>
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-start flex-none">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedProject.projectName}</h2>
                    <span className={`px-2 py-1 text-[10px] uppercase font-black rounded-md tracking-widest ${selectedProject.executionType === 'SERVICE' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                      {selectedProject.executionType || 'HYBRID'}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 font-medium">
                    <span className="flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-gray-400" /> {selectedProject.projectCode}</span>
                    <span className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" /> PM: {selectedProject.projectManager?.name || 'Unassigned'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-5 py-2 text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                    Edit Details
                  </button>
                  <button className="px-5 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
                    Manage Project
                  </button>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="px-8 border-b border-gray-200 dark:border-gray-800 flex overflow-x-auto scrollbar-hide flex-none bg-white dark:bg-gray-900 shadow-sm z-10">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-5 py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                        isActive 
                          ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-gray-50/50 dark:bg-gray-800/50' 
                          : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto">
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Financials KPI */}
                      <div className="col-span-1 md:col-span-3 grid grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Total Budget</p>
                          <h3 className="text-2xl font-black text-gray-900 dark:text-white">${(selectedProject.budget || 0).toLocaleString()}</h3>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-2 flex items-center gap-2"><Receipt className="w-4 h-4 text-red-500" /> Spent Cost</p>
                          <h3 className="text-2xl font-black text-red-600">${(selectedProject.actualCost || 0).toLocaleString()}</h3>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-2 flex items-center gap-2"><BarChart className="w-4 h-4 text-green-500" /> Remaining</p>
                          <h3 className="text-2xl font-black text-green-600">${((selectedProject.budget || 0) - (selectedProject.actualCost || 0)).toLocaleString()}</h3>
                        </div>
                        <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-xl shadow-lg text-white">
                          <p className="text-xs text-blue-300 uppercase font-black tracking-widest mb-2 flex items-center gap-2"><Activity className="w-4 h-4" /> Completion</p>
                          <h3 className="text-3xl font-black">{selectedProject.completionPercentage || 0}%</h3>
                        </div>
                      </div>

                      {/* Work Items KPI */}
                      <div className="col-span-2 grid grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-6">Task Execution</h3>
                          <div className="flex justify-between items-end mb-2">
                             <div>
                               <p className="text-4xl font-black text-blue-600">0</p>
                               <p className="text-xs font-bold text-gray-500 uppercase mt-1">Completed</p>
                             </div>
                             <div className="text-right">
                               <p className="text-3xl font-black text-gray-400">0</p>
                               <p className="text-xs font-bold text-gray-500 uppercase mt-1">Pending</p>
                             </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 mt-4"><div className="bg-blue-600 h-2 rounded-full w-0"></div></div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-6">Health Metrics</h3>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                               <span className="text-xs font-bold text-gray-500 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500" /> Open Issues</span>
                               <span className="text-sm font-black text-gray-900">0</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                               <span className="text-xs font-bold text-gray-500 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-orange-500" /> Identified Risks</span>
                               <span className="text-sm font-black text-gray-900">0</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-xs font-bold text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> Hours Logged</span>
                               <span className="text-sm font-black text-gray-900">0 hrs</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Details Sidebar */}
                      <div className="col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-4">Project Meta</h3>
                          <div className="space-y-4 text-sm">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Date</span>
                              <span className="font-bold text-gray-900 dark:text-white">{selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">End Date</span>
                              <span className="font-bold text-gray-900 dark:text-white">{selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</span>
                              <span className="font-bold text-orange-600 uppercase">{selectedProject.priority || 'Medium'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</span>
                              <span className="font-bold text-gray-900 dark:text-white">{selectedProject.customer?.name || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                  
                  {activeTab !== 'overview' && (
                    <GenericWorkspaceTab title={tabs.find(t => t.id === activeTab)?.label || 'Workspace'} project={selectedProject} />
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
            </div>
          )}
        </div>
      </div>

      {/* Filter Panel Slide-over */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right border-l border-gray-200 dark:border-gray-800">
            <div className="flex-none p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2 text-gray-900 dark:text-white"><SlidersHorizontal className="w-5 h-5 text-blue-600" /> Advanced Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 p-6 space-y-8 overflow-y-auto">
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['DRAFT', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'].map(s => (
                    <button key={s} onClick={() => setFilters({...filters, 'Status': s})} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${filters['Status'] === s ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{s.replace('_', ' ')}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Priority</h3>
                <div className="flex flex-wrap gap-2">
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => (
                    <button key={s} onClick={() => setFilters({...filters, 'Priority': s})} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${filters['Priority'] === s ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Execution Type</h3>
                <div className="flex flex-wrap gap-2">
                  {['SERVICE', 'PRODUCT', 'HYBRID'].map(s => (
                    <button key={s} onClick={() => setFilters({...filters, 'Type': s})} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${filters['Type'] === s ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Department</h3>
                <div className="flex flex-wrap gap-2">
                  {['Enterprise', 'SMB', 'Government', 'Internal'].map(s => (
                    <button key={s} onClick={() => setFilters({...filters, 'Department': s})} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${filters['Department'] === s ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{s}</button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Customer</h3>
                <select value={filters['Customer'] || ''} onChange={(e) => setFilters({...filters, 'Customer': e.target.value})} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none shadow-sm">
                  <option value="">All Customers</option>
                  {Array.from(new Set(projects.filter(p => p.customerId).map(p => p.customerId))).map(id => {
                    const cust = projects.find(p => p.customerId === id)?.customer;
                    return <option key={id} value={id}>{cust?.name || cust?.company}</option>
                  })}
                </select>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Project Manager</h3>
                <select value={filters['Manager'] || ''} onChange={(e) => setFilters({...filters, 'Manager': e.target.value})} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none shadow-sm">
                  <option value="">All Managers</option>
                  {Array.from(new Set(projects.filter(p => p.projectManagerId).map(p => p.projectManagerId))).map(id => {
                    const mgr = projects.find(p => p.projectManagerId === id)?.projectManager;
                    return <option key={id} value={id}>{mgr?.name || mgr?.user?.name || mgr?.email}</option>
                  })}
                </select>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Budget Range</h3>
                <select value={filters['Budget'] || ''} onChange={(e) => setFilters({...filters, 'Budget': e.target.value})} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none shadow-sm">
                  <option value="">All Budgets</option>
                  <option value="under10k">Under $10,000</option>
                  <option value="10k-50k">$10,000 - $50,000</option>
                  <option value="over50k">Over $50,000</option>
                </select>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Progress</h3>
                <select value={filters['Progress'] || ''} onChange={(e) => setFilters({...filters, 'Progress': e.target.value})} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none shadow-sm">
                  <option value="">Any Progress</option>
                  <option value="0">0% (Not Started)</option>
                  <option value="under50">Under 50%</option>
                  <option value="over50">50% and above</option>
                  <option value="100">100% (Completed)</option>
                </select>
              </div>
            </div>
            <div className="flex-none p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3 bg-white dark:bg-gray-900">
              <button onClick={() => setFilters({})} className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-black uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Clear</button>
              <button onClick={() => setIsFilterOpen(false)} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-black uppercase tracking-wider shadow-md hover:bg-blue-700 transition-colors">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
