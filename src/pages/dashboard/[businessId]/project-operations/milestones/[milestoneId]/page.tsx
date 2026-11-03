import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, Edit, Trash2, ShieldCheck, Flag, Calendar, Users,
  DollarSign, Activity, FileText, CheckSquare, Upload, AlertCircle, Link as LinkIcon
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { UserSelect } from "@/components/project-operations/UserSelect";

const STATUS_BADGES: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  NOT_STARTED: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  PLANNED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  DELAYED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  AT_RISK: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  CANCELLED: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

export default function MilestoneDetailPage() {
  const { businessId, milestoneId } = useParams() as any;
  const navigate = useNavigate();
  const { toast } = useToast();

  const ALL_STANDARD_MILESTONE_TYPES = [
    'Contractual',
    'Internal',
    'Regulatory',
    'Review Gate',
    'Deliverable',
    'Payment / Billing',
    'Phase Gate',
    'Technical / Architectural',
    'Testing / QA',
    'Go-Live / Deployment',
    'Customer Sign-Off',
    'Procurement',
    'Operational',
    'Maintenance & Support'
  ];

  const [loading, setLoading] = useState(true);
  const [milestone, setMilestone] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOptions, setFormOptions] = useState<any>({
    plans: [],
    types: ALL_STANDARD_MILESTONE_TYPES,
    linkedUsers: [],
    linkedUserIds: []
  });

  // Edit form state
  const [editForm, setEditForm] = useState<any>({});

  const API = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');

  const getHeaders = () => {
    let token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] ||
        document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
    }
    return {
      'Authorization': `Bearer ${token}`,
      'x-business-id': businessId as string,
      'Content-Type': 'application/json'
    };
  };

  const loadMilestone = async () => {
    setLoading(true);
    try {
      const h = getHeaders();
      const res = await fetch(`${API}/api/milestones/${milestoneId}`, { headers: h });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Milestone not found');
      }
      setMilestone(data.milestone);
      setEditForm({
        name: data.milestone.name || '',
        description: data.milestone.description || '',
        status: data.milestone.status || 'NOT_STARTED',
        priority: data.milestone.priority || 'MEDIUM',
        startDate: data.milestone.startDate ? data.milestone.startDate.slice(0, 10) : '',
        dueDate: data.milestone.dueDate ? data.milestone.dueDate.slice(0, 10) : '',
        paymentWeight: data.milestone.weight || 0,
        estimatedCost: data.milestone.estimatedCost || 0,
        currency: data.milestone.currency || 'USD',
        isBilling: Boolean(data.milestone.isBilling),
        riskLevel: data.milestone.riskLevel || 'LOW',
        riskMitigation: data.milestone.riskMitigation || '',
        completionNotes: data.milestone.completionNotes || '',
        ownerId: data.milestone.ownerId || '',
        projectManagerId: data.milestone.projectManagerId || '',
        approverId: data.milestone.approverId || '',
        department: data.milestone.department || '',
      });
    } catch (err: any) {
      toast({ title: 'Error Loading Milestone', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (milestoneId) loadMilestone();
  }, [milestoneId, businessId]);

  // Toggle checklist item
  const handleToggleItem = async (itemId: string, currentDone: boolean) => {
    try {
      const h = getHeaders();
      const res = await fetch(`${API}/api/milestones/${milestoneId}/items/${itemId}/toggle`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ isDone: !currentDone })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Toggle failed');

      // Update local item and milestone progress
      setMilestone((prev: any) => ({
        ...prev,
        completion: data.milestoneProgress,
        items: prev.items.map((it: any) => it.id === itemId ? { ...it, isDone: !currentDone } : it)
      }));
      toast({ title: 'Checklist Updated', description: `Progress is now ${data.milestoneProgress}%` });
    } catch (err: any) {
      toast({ title: 'Action Failed', description: err.message, variant: 'destructive' });
    }
  };

  // Approve Milestone
  const handleApprove = async () => {
    try {
      const h = getHeaders();
      const res = await fetch(`${API}/api/milestones/${milestoneId}/approve`, {
        method: 'POST',
        headers: h
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Approval failed');

      setMilestone((prev: any) => ({
        ...prev,
        status: 'COMPLETED',
        actualCompletion: new Date().toISOString()
      }));
      toast({ title: 'Approved', description: 'Milestone marked as Completed.' });
    } catch (err: any) {
      toast({ title: 'Approval Failed', description: err.message, variant: 'destructive' });
    }
  };

  // Delete Milestone
  const handleDelete = async () => {
    if (!window.confirm(`Delete milestone ${milestone?.milestoneCode}?`)) return;
    try {
      const h = getHeaders();
      const res = await fetch(`${API}/api/milestones/${milestoneId}`, {
        method: 'DELETE',
        headers: h
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');

      toast({ title: 'Deleted', description: 'Milestone removed successfully.' });
      navigate(`/dashboard/${businessId}/project-operations/milestones`);
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
    }
  };

  // Save Edits
  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const h = getHeaders();
      const payload: any = {
        name: editForm.name,
        description: editForm.description,
        status: editForm.status,
        priority: editForm.priority,
        startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : null,
        dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
        isBilling: editForm.isBilling,
        weight: editForm.isBilling ? Number(editForm.paymentWeight) : 0,
        estimatedCost: Number(editForm.estimatedCost) || 0,
        currency: editForm.currency,
        riskLevel: editForm.riskLevel,
        riskMitigation: editForm.riskMitigation,
        completionNotes: editForm.completionNotes,
        ownerId: editForm.ownerId || null,
        projectManagerId: editForm.projectManagerId || null,
        approverId: editForm.approverId || null,
        department: editForm.department || null,
      };

      const res = await fetch(`${API}/api/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: h,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');

      setMilestone(data.milestone);
      setIsEditing(false);
      toast({ title: 'Updated', description: 'Milestone details updated.' });
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!milestone) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-0.5 rounded-full">
                  {milestone.milestoneCode}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_BADGES[milestone.status] || STATUS_BADGES.NOT_STARTED}`}>
                  {milestone.status?.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {milestone.name}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Project: <span className="font-semibold text-gray-700 dark:text-gray-300">{milestone.project?.projectName || '—'}</span>
                {milestone.planning && (
                  <> · Schedule: <span className="font-semibold text-gray-700 dark:text-gray-300">{milestone.planning.planName}</span></>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                {milestone.status !== 'COMPLETED' && (
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-sm transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" /> Approve
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Edit Form or Detail View */}
        {isEditing ? (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 space-y-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white border-b pb-3">Edit Milestone</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <label className="text-xs font-semibold uppercase text-gray-500">Milestone Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full mt-1.5 p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full mt-1.5 p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="DRAFT">Draft</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="AT_RISK">At Risk</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Start Date</label>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                  className="w-full mt-1.5 p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Target Date (Due Date)</label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="w-full mt-1.5 p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                  className="w-full mt-1.5 p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Milestone Type</label>
                <select
                  value={editForm.typeId}
                  onChange={e => setEditForm({ ...editForm, typeId: e.target.value })}
                  className="w-full mt-1.5 p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                >
                  <option value="">Select Type...</option>
                  {(formOptions.types && formOptions.types.length > 0 ? formOptions.types : ALL_STANDARD_MILESTONE_TYPES).map((t: string) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Planning / Master Schedule</label>
                <select
                  value={editForm.planningId}
                  onChange={e => setEditForm({ ...editForm, planningId: e.target.value })}
                  className="w-full mt-1.5 p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                >
                  <option value="">None / Direct Project Milestone</option>
                  {formOptions.plans?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.planCode} — {p.planName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Project Manager</label>
                <div className="mt-1.5">
                  <UserSelect
                    businessId={businessId as string}
                    value={editForm.projectManagerId}
                    onChange={(v: string) => setEditForm({ ...editForm, projectManagerId: v })}
                    placeholder="Select Project Manager..."
                    allowedUserIds={formOptions.linkedUserIds && formOptions.linkedUserIds.length > 0 ? formOptions.linkedUserIds : undefined}
                    customUsers={formOptions.linkedUsers && formOptions.linkedUsers.length > 0 ? formOptions.linkedUsers : undefined}
                    emptyMessage="No team members assigned to this project or planning."
                  />
                </div>
              </div>

              <div className="lg:col-span-3">
                <label className="text-xs font-semibold uppercase text-gray-500">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full mt-1.5 p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Details & Deliverables */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Bar Card */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Milestone Completion</span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">{milestone.completion || 0}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${milestone.completion || 0}%` }}
                  />
                </div>
              </div>

              {/* Interactive Checklist Items */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" /> Deliverables & Criteria Checklist
                </h3>
                {milestone.items?.length > 0 ? (
                  <div className="space-y-3">
                    {milestone.items.map((it: any) => (
                      <div
                        key={it.id}
                        onClick={() => handleToggleItem(it.id, it.isDone)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${it.isDone
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                            : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={it.isDone}
                          onChange={() => { }}
                          className="w-4 h-4 text-emerald-600 rounded cursor-pointer pointer-events-none"
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${it.isDone ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white font-medium'}`}>
                            {it.title}
                          </span>
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {it.kind === 'DELIVERABLE' ? 'Deliverable' : 'Criteria'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center">No checklist items defined for this milestone.</p>
                )}
              </div>

              {/* Connected Tasks */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" /> Linked Tasks ({milestone.tasks?.length || 0})
                </h3>
                {milestone.tasks?.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {milestone.tasks.map((t: any) => (
                      <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-600">{t.taskNumber}</span>
                          <span className="text-gray-800 dark:text-gray-200 font-medium">{t.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-500">{t.completionPercentage || 0}%</span>
                          <span className="px-2 py-0.5 rounded font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center">No tasks linked directly to this milestone.</p>
                )}
              </div>

              {/* Attachments */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Attached Documents ({milestone.documents?.length || 0})
                </h3>
                {milestone.documents?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {milestone.documents.map((doc: any) => (
                      <a
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
                      >
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{doc.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-mono">{doc.extension || 'file'}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center">No documents uploaded.</p>
                )}
              </div>
            </div>

            {/* Right 1 Col: Metadata & Commercials */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Milestone Details</h3>
                <div className="space-y-3 text-xs divide-y divide-gray-100 dark:divide-gray-800">
                  <div className="flex justify-between pt-2 first:pt-0">
                    <span className="text-gray-400">Target Date</span>
                    <span className="font-bold text-gray-900 dark:text-white">{milestone.dueDate ? milestone.dueDate.slice(0, 10) : '—'}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Start Date</span>
                    <span className="font-bold text-gray-900 dark:text-white">{milestone.startDate ? milestone.startDate.slice(0, 10) : '—'}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Duration</span>
                    <span className="font-bold text-gray-900 dark:text-white">{milestone.duration !== null ? `${milestone.duration} days` : '—'}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Billing Milestone</span>
                    <span className="font-bold text-gray-900 dark:text-white">{milestone.isBilling ? 'Yes' : 'No'}</span>
                  </div>
                  {milestone.isBilling && (
                    <div className="flex justify-between pt-2">
                      <span className="text-gray-400">Payment Weight</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{milestone.weight || 0}%</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Estimated Cost</span>
                    <span className="font-bold text-gray-900 dark:text-white">{milestone.currency} {Number(milestone.estimatedCost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Risk Level</span>
                    <span className="font-bold text-gray-900 dark:text-white">{milestone.riskLevel || 'Low'}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Owner</span>
                    <span className="font-bold text-gray-900 dark:text-white">{milestone.owner?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Manager</span>
                    <span className="font-bold text-gray-900 dark:text-white">{milestone.projectManager?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Approver</span>
                    <span className="font-bold text-gray-900 dark:text-white">{milestone.approver?.name || '—'}</span>
                  </div>
                </div>

                {milestone.riskMitigation && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">Risk Mitigation Strategy:</span>
                    <p className="text-amber-700 dark:text-amber-400">{milestone.riskMitigation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

