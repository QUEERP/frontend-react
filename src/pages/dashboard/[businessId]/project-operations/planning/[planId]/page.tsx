import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Calendar, Clock, Users, DollarSign,
  CheckCircle2, AlertTriangle, FileText, ChevronRight, Briefcase,
  Target, Shield, ExternalLink, Printer, Info, CheckCircle, Flag,
  Clock4, Award, UserCheck, Layers, Hash, Sparkles, Building2,
  Paperclip, Eye, Download, X, CheckSquare, Plus
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { ALL_CURRENCIES } from '@/lib/constants/currencies';

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    'DRAFT': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    'PLANNING': 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    'ACTIVE': 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    'ON_HOLD': 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    'COMPLETED': 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${colors[status] || colors['DRAFT']}`}>
      {(status || 'DRAFT').replace('_', ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = {
    'Low': 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    'Medium': 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    'High': 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    'Critical': 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };
  return priority ? (
    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${colors[priority] || colors['Medium']}`}>
      {priority}
    </span>
  ) : null;
};

const RiskBadge = ({ risk }: { risk: string }) => {
  const colors: Record<string, string> = {
    'Low': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Medium': 'bg-amber-50 text-amber-700 border-amber-200',
    'High': 'bg-rose-50 text-rose-700 border-rose-200',
    'Critical': 'bg-red-100 text-red-800 border-red-300',
  };
  return risk ? (
    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${colors[risk] || 'bg-gray-100 text-gray-700'}`}>
      Risk: {risk}
    </span>
  ) : null;
};

export default function PlanningViewPage() {
  const { businessId, planId } = useParams() as any;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [planning, setPlanning] = useState<any>(null);
  const [usersMap, setUsersMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'team' | 'tasks' | 'financials' | 'notes' | 'documents'>('overview');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewingDoc, setPreviewingDoc] = useState<{ title: string; fileUrl: string; fileType?: string; fileSize?: number } | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const handleTogglePlanningComplete = async (targetStatus?: string) => {
    if (!planning) return;
    const nextStatus = targetStatus || (planning.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED');
    const isCompleted = nextStatus === 'COMPLETED';
    try {
      setIsTogglingStatus(true);
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const payload = {
        status: nextStatus,
        completionPercentage: isCompleted ? 100 : 0,
        currentProgress: isCompleted ? 100 : 0,
        progressStatus: isCompleted ? 'Completed' : 'In Progress'
      };
      const res = await fetch(`${API_BASE}/api/projects/global/plannings/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
          'x-business-id': businessId
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update schedule status');
      }
      toast({
        title: isCompleted ? "Schedule Completed" : "Schedule Reopened",
        description: isCompleted
          ? `"${planning.planName}" (${planning.planCode}) marked as 100% completed.`
          : `"${planning.planName}" reopened as Active.`
      });
      await loadData();
    } catch (err: any) {
      toast({
        title: "Update Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      setUpdatingTaskId(taskId);
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const res = await fetch(`${API_BASE}/api/projects/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
          'x-business-id': businessId
        },
        body: JSON.stringify({
          status: newStatus,
          completionPercentage: newStatus === 'DONE' ? 100 : (newStatus === 'IN_PROGRESS' ? 50 : 0)
        })
      });
      if (!res.ok) throw new Error('Failed to update task status');
      toast({
        title: "Task Updated",
        description: `Task status changed to ${newStatus.replace('_', ' ')}. Schedule progress synchronized.`
      });
      await loadData();
    } catch (err: any) {
      toast({
        title: "Update Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocIcon = (title: string, mime?: string) => {
    const t = (title || '').toLowerCase();
    const m = (mime || '').toLowerCase();
    if (m.startsWith('image/') || t.endsWith('.png') || t.endsWith('.jpg') || t.endsWith('.jpeg') || t.endsWith('.svg') || t.endsWith('.webp')) return '🖼️';
    if (m === 'application/pdf' || t.endsWith('.pdf')) return '📄';
    if (m.includes('word') || t.endsWith('.doc') || t.endsWith('.docx')) return '📝';
    if (m.includes('excel') || m.includes('spreadsheet') || t.endsWith('.xls') || t.endsWith('.xlsx') || t.endsWith('.csv')) return '📊';
    if (m.includes('zip') || m.includes('rar') || t.endsWith('.zip') || t.endsWith('.rar')) return '🗜️';
    return '📎';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewingDoc) {
        setPreviewingDoc(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewingDoc]);

  const getToken = () => {
    let token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    if (!token || token === 'null' || token === 'undefined') {
      token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ||
        document.cookie.split('; ').find(r => r.startsWith('accessToken='))?.split('=')[1] || '';
    }
    return token;
  };

  const loadData = async () => {
    if (!businessId || !planId) return;
    try {
      setLoading(true);
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const headers = {
        'Authorization': `Bearer ${getToken()}`,
        'x-business-id': businessId
      };

      const [planRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/api/projects/global/plannings/${planId}`, { headers }),
        fetch(`${API_BASE}/api/user-management`, { headers }).catch(() => null)
      ]);

      const planData = await planRes.json();
      if (!planRes.ok || !planData.success || !planData.planning) {
        throw new Error(planData.message || 'Planning schedule not found');
      }

      setPlanning(planData.planning);

      if (userRes && userRes.ok) {
        const uData = await userRes.json();
        const rawUsers = uData.data || uData.users || [];
        const map = new Map<string, any>();
        rawUsers.forEach((u: any) => {
          const uId = u.user?.id || u.id;
          const uName = typeof u.user === 'object' && u.user?.name ? u.user.name : (typeof u.name === 'string' ? u.name : (u.user?.email || u.email || 'Team Member'));
          const uEmail = typeof u.user === 'object' && u.user?.email ? u.user.email : (typeof u.email === 'string' ? u.email : '');
          const uRole = typeof u.role === 'object' && u.role !== null ? (u.role.name || 'Member') : (typeof u.role === 'string' ? u.role : 'Member');
          const uDept = typeof u.department === 'object' && u.department !== null ? (u.department.name || 'General') : (typeof u.department === 'string' ? u.department : 'General');
          map.set(uId, { id: uId, name: uName, email: uEmail, role: uRole, department: uDept });
        });
        setUsersMap(map);
      }
    } catch (err: any) {
      console.error("Error loading planning details:", err);
      toast({
        title: "Error loading schedule",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId, planId]);

  const handleDelete = async () => {
    if (!businessId || !planId) return;
    try {
      setIsDeleting(true);
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const res = await fetch(`${API_BASE}/api/projects/global/plannings/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'x-business-id': businessId
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete planning schedule');
      }
      toast({
        title: "Schedule Deleted",
        description: `Plan "${planning?.planName}" (${planning?.planCode}) has been removed.`
      });
      navigate(`/dashboard/${businessId}/project-operations/planning`);
    } catch (err: any) {
      toast({
        title: "Delete Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  const getCurrencySymbol = (code?: string) => {
    if (!code) return '$';
    const match = ALL_CURRENCIES.find(c => c.code === code.toUpperCase());
    return match ? match.symbol : code;
  };

  const fmtCurrency = (val?: number | null, cur?: string) => {
    const num = val || 0;
    const sym = getCurrencySymbol(cur || planning?.currency || 'USD');
    return `${sym} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4.5rem)] bg-gray-50 dark:bg-gray-950 p-6">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Loading Master Schedule...</h3>
        <p className="text-xs text-gray-500 mt-1">Fetching planning breakdown, resources, and dependencies.</p>
      </div>
    );
  }

  if (!planning) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4.5rem)] bg-gray-50 dark:bg-gray-950 p-6 text-center">
        <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-2xl mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Planning Schedule Not Found</h2>
        <p className="text-sm text-gray-500 max-w-md mt-1 mb-6">
          The requested master schedule may have been deleted or you do not have permission to access it.
        </p>
        <button
          onClick={() => navigate(`/dashboard/${businessId}/project-operations/planning`)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Planning Workspace
        </button>
      </div>
    );
  }

  // Parse task owners list
  let taskOwnerIds: string[] = [];
  if (planning.taskOwnerId) {
    try {
      if (planning.taskOwnerId.startsWith('[') && planning.taskOwnerId.endsWith(']')) {
        taskOwnerIds = JSON.parse(planning.taskOwnerId);
      } else {
        taskOwnerIds = planning.taskOwnerId.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    } catch {
      taskOwnerIds = [planning.taskOwnerId];
    }
  }

  // Resolve Project Manager
  const pmUser = planning.projectManagerId ? usersMap.get(planning.projectManagerId) : null;
  const projectManagerDisplay = pmUser
    ? `${pmUser.name}${pmUser.role ? ` (${pmUser.role})` : ''}`
    : (planning.project?.projectManager?.name || planning.projectManagerId || 'Unassigned');

  return (
    <div className="min-h-[calc(100vh-4.25rem)] bg-gray-50 dark:bg-gray-950 flex flex-col w-full min-w-0">
      {/* Top Header & Breadcrumbs */}
      <div className="flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Breadcrumbs & Title */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Link to={`/dashboard/${businessId}/project-operations`} className="hover:text-blue-600 transition-colors">Project Operations</Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <Link to={`/dashboard/${businessId}/project-operations/planning`} className="hover:text-blue-600 transition-colors">Planning</Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-blue-600 font-bold">{planning.planCode}</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => navigate(`/dashboard/${businessId}/project-operations/planning`)}
                title="Back to planning list"
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                {planning.planName}
              </h1>

              <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                {planning.planCode}
              </span>

              <StatusBadge status={planning.status} />
              {planning.priority && <PriorityBadge priority={planning.priority} />}
              {planning.execType && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  {planning.execType}
                </span>
              )}
              {planning.criticalTask && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                  <Flag className="w-3 h-3" /> Critical Task
                </span>
              )}
              {planning.recurring && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Recurring
                </span>
              )}
            </div>

            {planning.project && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pt-0.5">
                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                <span>Project:</span>
                <Link
                  to={`/dashboard/${businessId}/project-operations/projects/${planning.projectId}`}
                  className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  {planning.project.projectCode} — {planning.project.projectName}
                  <ExternalLink className="w-3 h-3" />
                </Link>
                {planning.department && (
                  <>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <span>Department: <strong className="text-gray-700 dark:text-gray-300">{planning.department}</strong></span>
                  </>
                )}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {planning.status !== 'COMPLETED' ? (
              <button
                type="button"
                onClick={() => handleTogglePlanningComplete('COMPLETED')}
                disabled={isTogglingStatus}
                title="Mark this schedule and connected tasks as 100% completed"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isTogglingStatus ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                <span>Complete Schedule</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleTogglePlanningComplete('ACTIVE')}
                disabled={isTogglingStatus}
                title="Schedule is completed. Click to reopen as Active."
                className="px-3.5 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Completed (Reopen)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              title="Print view"
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="px-3 py-2 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/dashboard/${businessId}/project-operations/planning/${planId}/edit`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setPreviewingDoc(null)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl select-none">{getDocIcon(previewingDoc.title, previewingDoc.fileType)}</span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{previewingDoc.title}</h3>
                  <p className="text-xs text-gray-400">{formatFileSize(previewingDoc.fileSize)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewingDoc.fileUrl}
                  download={previewingDoc.title}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewingDoc(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[350px] max-h-[70vh] bg-gray-100 dark:bg-gray-950/50">
              {previewingDoc.title.toLowerCase().endsWith('.pdf') || (previewingDoc.fileType && previewingDoc.fileType.includes('pdf')) ? (
                <iframe src={previewingDoc.fileUrl} title={previewingDoc.title} className="w-full h-full min-h-[500px] border-0 rounded-lg shadow-sm" />
              ) : previewingDoc.fileType?.startsWith('image/') || /\.(png|jpe?g|svg|webp|gif)$/i.test(previewingDoc.title) ? (
                <img src={previewingDoc.fileUrl} alt={previewingDoc.title} className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md mx-auto" />
              ) : (
                <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm max-w-md">
                  <span className="text-5xl mb-4 block">{getDocIcon(previewingDoc.title, previewingDoc.fileType)}</span>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate mb-1">{previewingDoc.title}</h4>
                  <p className="text-xs text-gray-500 mb-4">Preview not available for this file type. Please download to view.</p>
                  <a
                    href={previewingDoc.fileUrl}
                    download={previewingDoc.title}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Download File
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center text-xs text-gray-500 flex-shrink-0">
              <span>Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-mono text-[10px]">Esc</kbd> to close</span>
              <button
                type="button"
                onClick={() => setPreviewingDoc(null)}
                className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Completion */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completion</span>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900 dark:text-white">
                    {planning.completionPercentage || 0}%
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    Status: <strong className="text-blue-600">{planning.progressStatus || 'On Track'}</strong>
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, planning.completionPercentage || 0))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Timeline */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Timeline</span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900 dark:text-white">
                    {planning.duration != null ? `${planning.duration} Days` : '—'}
                  </span>
                  {planning.workingDays != null && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ({planning.workingDays} working)
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2 truncate">
                  {fmtDate(planning.startDate)} → {fmtDate(planning.endDate)}
                </p>
              </div>
            </div>

            {/* Card 3: Team & Capacity */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Team Capacity</span>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900 dark:text-white">
                    {planning.resources || taskOwnerIds.length || 0}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">Allocated Resources</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 truncate">
                  Est: <strong className="text-gray-800 dark:text-gray-200">{planning.estimatedHours || 0} hrs</strong> • Billable: <strong className="text-gray-800 dark:text-gray-200">{planning.billableHours || 0} hrs</strong>
                </p>
              </div>
            </div>

            {/* Card 4: Budget */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Budget Est.</span>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {fmtCurrency(planning.estimatedCost, planning.currency)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 truncate">
                  Actual: <strong className="text-gray-800 dark:text-gray-200">{fmtCurrency(planning.actualCost, planning.currency)}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto pb-px">
            {[
              { id: 'overview', label: '1. Overview & Schedule', icon: Briefcase },
              { id: 'team', label: '2. Team & Resources', icon: Users },
              { id: 'tasks', label: `3. Task Execution${planning?.tasks?.length ? ` (${planning.tasks.length})` : ''}`, icon: Layers },
              { id: 'financials', label: '4. Financial Performance', icon: DollarSign },
              { id: 'notes', label: '5. Notes & Sign-off', icon: FileText },
              { id: 'documents', label: `6. Documents & Attachments (${planning?.documents?.length || 0})`, icon: Paperclip },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 rounded-t-lg'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content 1: Overview & Schedule */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Prominent Schedule Progress & Execution Meter */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                        Schedule Progress & Execution Meter
                      </h3>
                      <p className="text-xs text-gray-500">Real-time progress tracking and completion status</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-black ${
                      (planning.completionPercentage || 0) >= 100 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {planning.completionPercentage || 0}%
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      planning.status === 'COMPLETED' || (planning.completionPercentage || 0) >= 100
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : planning.progressStatus === 'Delayed'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        : planning.progressStatus === 'At Risk'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    }`}>
                      {planning.progressStatus || (planning.status === 'COMPLETED' ? 'Completed' : 'On Track')}
                    </span>
                  </div>
                </div>

                {/* Large Progress Bar */}
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-3.5 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (planning.completionPercentage || 0) >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, planning.completionPercentage || 0))}%` }}
                  />
                </div>

                {/* Progress Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Initial Progress</span>
                    <p className="text-xl font-black text-gray-900 dark:text-white mt-1">{planning.initialProgress || 0}%</p>
                  </div>
                  <div className="p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/40">
                    <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Current Progress</span>
                    <p className="text-xl font-black text-gray-900 dark:text-white mt-1">{planning.currentProgress || 0}%</p>
                  </div>
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Overall Completion</span>
                    <p className="text-xl font-black text-gray-900 dark:text-white mt-1">{planning.completionPercentage || 0}%</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Information Card */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">General Information</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 font-medium">Planning Code</span>
                      <p className="font-mono font-bold text-gray-900 dark:text-white mt-0.5">{planning.planCode}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 font-medium">Planning Name</span>
                      <p className="font-bold text-gray-900 dark:text-white mt-0.5">{planning.planName}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 font-medium">Phase</span>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{planning.phase || planning.sprint || planning.execType || '—'}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 font-medium">Sprint / Iteration</span>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{planning.sprint || '—'}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 font-medium">Department</span>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{planning.department || '—'}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 font-medium">Execution Type</span>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{planning.execType || 'Turnkey (End-to-End)'}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 font-medium">Schedule Status</span>
                      <div className="mt-1"><StatusBadge status={planning.status} /></div>
                    </div>

                    <div>
                      <span className="text-gray-400 font-medium">Priority</span>
                      <div className="mt-1"><PriorityBadge priority={planning.priority} /></div>
                    </div>
                  </div>

                  {planning.description && (
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-xs text-gray-400 font-medium">Description / Scope Notes</span>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                        {planning.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Timeline & Milestones Card */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Timeline & Duration</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 font-medium">Start Date</span>
                      <p className="font-bold text-gray-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {fmtDate(planning.startDate)}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400 font-medium">End Date</span>
                      <p className="font-bold text-gray-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {fmtDate(planning.endDate)}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400 font-medium">Expected Completion</span>
                      <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                        {fmtDate(planning.expectedCompletion)}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400 font-medium">Calendar Duration</span>
                      <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                        {planning.duration != null ? `${planning.duration} Calendar Days` : '—'}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400 font-medium">Working Days</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {planning.workingDays != null ? `${planning.workingDays} Business Days` : '—'}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400 font-medium">Risk Level</span>
                      <div className="mt-1"><RiskBadge risk={planning.riskLevel || 'Low'} /></div>
                    </div>

                    <div className="col-span-2">
                      <span className="text-gray-400 font-medium">Target Milestone</span>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5 bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                        {planning.milestone || 'No specific milestone assigned'}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <span className="text-gray-400 font-medium">Dependencies / Predecessors</span>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5 bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                        {planning.dependency || 'No dependencies specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: Team & Resources */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Manager Card */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Project Manager</h3>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm flex-shrink-0">
                      {projectManagerDisplay.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{projectManagerDisplay}</h4>
                      <p className="text-[11px] text-gray-500 truncate">{pmUser?.email || planning.project?.projectManager?.email || 'Project Leader'}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                        Authorized Manager
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs pt-2">
                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-400">Department</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{planning.department || 'Engineering'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-400">Resources Count</span>
                      <span className="font-bold text-gray-900 dark:text-white">{planning.resources || taskOwnerIds.length || 0} Members</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Task Owners Card */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Assigned Task Owners</h3>
                    </div>
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2.5 py-0.5 rounded-full">
                      {taskOwnerIds.length} Assigned
                    </span>
                  </div>

                  {taskOwnerIds.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">
                      No specific task owners assigned to this schedule.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {taskOwnerIds.map((id: string) => {
                        const user = usersMap.get(id);
                        const name = user ? user.name : id;
                        const role = user ? user.role : 'Team Member';
                        const email = user ? user.email : '';
                        const dept = user ? user.department : planning.department;

                        return (
                          <div key={id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/60 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">{name}</h5>
                              <p className="text-[11px] text-gray-500 truncate">{role} • {dept}</p>
                              {email && <p className="text-[10px] text-gray-400 truncate mt-0.5">{email}</p>}
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                              Assigned
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Hours & Resource Cost */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                      <span className="text-gray-400 font-medium">Estimated Hours</span>
                      <p className="text-base font-black text-gray-900 dark:text-white mt-0.5">{planning.estimatedHours || 0} hrs</p>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                      <span className="text-gray-400 font-medium">Billable Hours</span>
                      <p className="text-base font-black text-gray-900 dark:text-white mt-0.5">{planning.billableHours || 0} hrs</p>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                      <span className="text-gray-400 font-medium">Resource Cost</span>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {fmtCurrency(planning.resourceCost, planning.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Task Execution */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Task Breakdown & Sequence</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                    <span className="text-gray-400 font-medium">Primary Task Title</span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{planning.taskTitle || '—'}</p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                    <span className="text-gray-400 font-medium">Sub-Task</span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{planning.subTask || '—'}</p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                    <span className="text-gray-400 font-medium">Execution Sequence</span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                      {planning.sequence != null ? `Step #${planning.sequence}` : '—'}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                    <span className="text-gray-400 font-medium">Critical Path Task</span>
                    <p className="text-xs font-bold mt-1">
                      {planning.criticalTask ? (
                        <span className="text-rose-600 font-bold">Yes (Critical Path)</span>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400">No (Standard)</span>
                      )}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                    <span className="text-gray-400 font-medium">Recurring Task</span>
                    <p className="text-xs font-bold mt-1">
                      {planning.recurring ? (
                        <span className="text-purple-600 font-bold">Yes (Recurring Schedule)</span>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400">One-time Task</span>
                      )}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                    <span className="text-gray-400 font-medium">Automated Reminder</span>
                    <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                      {planning.reminder != null ? `${planning.reminder} Days in Advance` : 'Disabled'}
                    </p>
                  </div>
                </div>

                {/* Progress Breakdown */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Progress Tracking</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-blue-50/40 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                      <span className="text-blue-600 font-medium">Initial Progress</span>
                      <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{planning.initialProgress || 0}%</p>
                    </div>

                    <div className="p-3 bg-purple-50/40 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/40">
                      <span className="text-purple-600 font-medium">Current Progress</span>
                      <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{planning.currentProgress || 0}%</p>
                    </div>

                    <div className="p-3 bg-emerald-50/40 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                      <span className="text-emerald-600 font-medium">Overall Completion</span>
                      <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{planning.completionPercentage || 0}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connected Project Tasks */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      Connected Project Tasks ({planning.tasks?.length || 0})
                    </h3>
                  </div>
                  <Link
                    to={`/dashboard/${businessId}/project-operations/tasks/create?projectId=${planning.projectId}&planningId=${planning.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Task for Schedule</span>
                  </Link>
                </div>

                {(!planning.tasks || planning.tasks.length === 0) ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No project tasks linked to this schedule yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Create a task linked to this planning schedule to track its execution here.</p>
                    <Link
                      to={`/dashboard/${businessId}/project-operations/tasks/create?projectId=${planning.projectId}&planningId=${planning.id}`}
                      className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add First Task
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-400">
                          <th className="py-2.5 px-3">Task Number</th>
                          <th className="py-2.5 px-3">Task Title</th>
                          <th className="py-2.5 px-3">Assignee</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Priority</th>
                          <th className="py-2.5 px-3">Progress</th>
                          <th className="py-2.5 px-3">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                        {planning.tasks.map((tsk: any) => (
                          <tr key={tsk.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-2.5 px-3 text-blue-600 font-bold">{tsk.taskNumber || tsk.taskCode || '-'}</td>
                            <td className="py-2.5 px-3 text-gray-900 dark:text-white font-bold">{tsk.title}</td>
                            <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">{tsk.assignedTo?.name || '-'}</td>
                            <td className="py-2.5 px-3">
                              <select
                                value={tsk.status === 'DONE' ? 'DONE' : (tsk.status || 'TODO')}
                                disabled={updatingTaskId === tsk.id}
                                onChange={(e) => handleTaskStatusChange(tsk.id, e.target.value)}
                                className="text-xs font-bold px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="TODO">TODO</option>
                                <option value="IN_PROGRESS">IN PROGRESS</option>
                                <option value="DONE">DONE (COMPLETED)</option>
                              </select>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{tsk.priority || '-'}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${tsk.completionPercentage || 0}%` }} />
                                </div>
                                <span className="text-[10px] font-bold">{tsk.completionPercentage || 0}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-gray-500">
                              {tsk.dueDate ? new Date(tsk.dueDate).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content 4: Financials */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Financial Breakdown</h3>
                  </div>
                  <span className="text-xs font-bold text-gray-600 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    Currency: {planning.currency || 'USD'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-bold text-gray-500 uppercase">Estimated Budget</span>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                      {fmtCurrency(planning.estimatedCost, planning.currency)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Planned cost allocation for this schedule</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-bold text-gray-500 uppercase">Actual Cost Incurred</span>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
                      {fmtCurrency(planning.actualCost, planning.currency)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Expenditure recorded to date</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-bold text-gray-500 uppercase">Cost Variance</span>
                    <p className={`text-2xl font-black mt-2 ${(planning.variance || 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {fmtCurrency(planning.variance, planning.currency)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {(planning.variance || 0) >= 0 ? 'Within allocated budget limits' : 'Budget overrun detected'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                  <span>Resource Unit Rate / Hourly Cost</span>
                  <strong className="text-sm font-black">{fmtCurrency(planning.resourceCost, planning.currency)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 5: Notes & Sign-off */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">General Comments</h3>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl min-h-[120px]">
                    {planning.comments || 'No general comments recorded.'}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Private Management Notes</h3>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-amber-50/30 dark:bg-amber-950/20 p-4 rounded-xl min-h-[120px] border border-amber-100 dark:border-amber-900/30">
                    {planning.privateNotes || 'No private management notes recorded.'}
                  </p>
                </div>

                <div className="md:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Approvals & Authority Reference</h3>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl">
                    {planning.approvals || 'Pending formal authority sign-off'}
                  </p>
                  <div className="flex items-center gap-6 text-[11px] text-gray-400 pt-2">
                    <span>Created: {fmtDate(planning.createdAt)}</span>
                    <span>Last Updated: {fmtDate(planning.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 6: Documents & Attachments */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      Attached Documents & Specifications
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                      {planning.documents?.length || 0} Files Attached
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/${businessId}/project-operations/planning/${planId}/edit`)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Manage Files</span>
                    </button>
                  </div>
                </div>

                {!planning.documents || planning.documents.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full mb-3">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">No Documents Attached</h4>
                    <p className="text-xs text-gray-400 max-w-sm mt-1 mb-4">
                      Upload contract scopes, requirements, architecture blueprints, or approval records in Edit Mode.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/${businessId}/project-operations/planning/${planId}/edit`)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Edit className="w-3.5 h-3.5" /> Attach Documents Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {planning.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="p-4 bg-gray-50/60 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700/60 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all flex flex-col justify-between group shadow-xs"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl select-none flex-shrink-0 mt-0.5">{getDocIcon(doc.title, doc.mimeType || doc.fileType)}</span>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors" title={doc.title}>
                              {doc.title}
                            </h5>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                              <span>{formatFileSize(doc.fileSize)}</span>
                              <span>•</span>
                              <span>{fmtDate(doc.createdAt)}</span>
                            </div>
                            {doc.folder && (
                              <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200/70 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {doc.folder}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
                          <button
                            type="button"
                            onClick={() => setPreviewingDoc(doc)}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                          <a
                            href={doc.fileUrl}
                            download={doc.title}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Document Preview Modal */}
      {previewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setPreviewingDoc(null)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl select-none">{getDocIcon(previewingDoc.title, previewingDoc.fileType)}</span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{previewingDoc.title}</h3>
                  <p className="text-xs text-gray-400">{formatFileSize(previewingDoc.fileSize)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewingDoc.fileUrl}
                  download={previewingDoc.title}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewingDoc(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[350px] max-h-[70vh] bg-gray-100 dark:bg-gray-950/50">
              {previewingDoc.title.toLowerCase().endsWith('.pdf') || (previewingDoc.fileType && previewingDoc.fileType.includes('pdf')) ? (
                <iframe src={previewingDoc.fileUrl} title={previewingDoc.title} className="w-full h-full min-h-[500px] border-0 rounded-lg shadow-sm" />
              ) : previewingDoc.fileType?.startsWith('image/') || /\.(png|jpe?g|svg|webp|gif)$/i.test(previewingDoc.title) ? (
                <img src={previewingDoc.fileUrl} alt={previewingDoc.title} className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md mx-auto" />
              ) : (
                <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm max-w-md">
                  <span className="text-5xl mb-4 block">{getDocIcon(previewingDoc.title, previewingDoc.fileType)}</span>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate mb-1">{previewingDoc.title}</h4>
                  <p className="text-xs text-gray-500 mb-4">Preview not available for this file type. Please download to view.</p>
                  <a
                    href={previewingDoc.fileUrl}
                    download={previewingDoc.title}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Download File
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center text-xs text-gray-500 flex-shrink-0">
              <span>Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-mono text-[10px]">Esc</kbd> to close</span>
              <button
                type="button"
                onClick={() => setPreviewingDoc(null)}
                className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => !isDeleting && setDeleteModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Master Schedule</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-gray-900 dark:text-white">{planning.planName}</strong> ({planning.planCode})? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

