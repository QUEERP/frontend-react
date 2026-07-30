import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Pencil, Trash2, Settings, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_ROOT } from "@/config/api";

const MASTER_TYPES = [
  { key: 'TASK_TYPE', label: 'Task Types', defaults: ['Development','Testing','Meeting','Research','Support','Deployment','Documentation','Review'] },
  { key: 'ISSUE_TYPE', label: 'Issue Types', defaults: ['Bug','Risk','Blocker','Feature','Enhancement','Change'] },
  { key: 'CHANGE_CATEGORY', label: 'Change Categories', defaults: ['Scope','Budget','Timeline','Requirement','Customer','Legal','Technical'] },
  { key: 'DOCUMENT_TYPE', label: 'Document Types', defaults: ['Contract','Invoice','Proposal','Requirement','Drawing','Design','Manual','Specification'] },
  { key: 'EXPENSE_CATEGORY', label: 'Expense Categories', defaults: ['Travel','Food','Software','Hardware','Training','Accommodation','Transport','Misc'] },
  { key: 'BILLING_TYPE', label: 'Billing Types', defaults: ['Fixed Price','Time & Material','Milestone','Retainer','Subscription'] },
  { key: 'RESOURCE_ROLE', label: 'Resource Roles', defaults: ['Developer','Designer','Tester','Architect','Project Manager','Business Analyst'] },
  { key: 'PRIORITY', label: 'Priorities', defaults: ['Low','Medium','High','Critical'] },
  { key: 'COST_CENTER', label: 'Cost Centers', defaults: [] },
  { key: 'DEPARTMENT', label: 'Departments', defaults: [] },
];

function getCookie(name: string) {
  return document.cookie.split('; ').find(r => r.startsWith(name + '='))?.split('=')[1];
}

export function GlobalMastersWorkspace({ businessId }: { businessId: string }) {
  const [activeType, setActiveType] = useState(MASTER_TYPES[0].key);
  const [masters, setMasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const getToken = () => getCookie('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('accessToken') || '' : '');
  
  const apiFetch = async (url: string, options: any = {}) => {
    const token = getToken();
    const res = await fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId, 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Request failed');
    }
    return res.json();
  };

  const fetchMasters = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const res = await apiFetch(`${API_ROOT}/project-operations/masters?type=${activeType}`);
      setMasters(res.masters || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMasters(); }, [businessId, activeType]);

  const filtered = useMemo(() => {
    if (!search) return masters;
    return masters.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  }, [masters, search]);

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    try {
      setIsSubmitting(true);
      if (editingId) {
        await apiFetch(`${API_ROOT}/project-operations/masters/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: formName, description: formDesc })
        });
        toast({ title: 'Updated' });
      } else {
        await apiFetch(`${API_ROOT}/project-operations/masters`, {
          method: 'POST',
          body: JSON.stringify({ type: activeType, name: formName, description: formDesc })
        });
        toast({ title: 'Created' });
      }
      setShowForm(false); setFormName(''); setFormDesc(''); setEditingId(null);
      fetchMasters();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await apiFetch(`${API_ROOT}/project-operations/masters/${id}`, { method: 'DELETE' });
      toast({ title: 'Deleted' });
      fetchMasters();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const startEdit = (m: any) => { setEditingId(m.id); setFormName(m.name); setFormDesc(m.description || ''); setShowForm(true); };

  const currentType = MASTER_TYPES.find(t => t.key === activeType);

  return (
    <div className="flex h-full bg-gray-50/50 dark:bg-[#0a0a0a]">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-500" /> Configuration
          </h2>
        </div>
        <nav className="p-2 space-y-0.5">
          {MASTER_TYPES.map(t => (
            <button key={t.key} onClick={() => { setActiveType(t.key); setShowForm(false); setSearch(''); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeType === t.key ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{currentType?.label}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{filtered.length} items configured</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm w-48" />
            </div>
            <button onClick={() => { setShowForm(true); setEditingId(null); setFormName(''); setFormDesc(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Add New
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-900/10 animate-in slide-in-from-top-2">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Name *</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Enter name..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Description</label>
                <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Optional description..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSubmit} disabled={isSubmitting || !formName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                  <Check className="w-4 h-4" /> {editingId ? 'Update' : 'Create'}
                </button>
                <button onClick={() => { setShowForm(false); setEditingId(null); setFormName(''); setFormDesc(''); }}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Settings className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">No items found</p>
              <p className="text-sm mt-1">Click "Add New" to create your first {currentType?.label.toLowerCase().replace('s', '')}.</p>
              {currentType?.defaults && currentType.defaults.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30 max-w-md text-center">
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Suggested defaults:</p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">{currentType.defaults.join(' • ')}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-xs uppercase font-bold text-gray-500 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Description</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {filtered.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">{m.name}</td>
                      <td className="px-6 py-4 text-gray-500">{m.description || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${m.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {m.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => startEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(m.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
