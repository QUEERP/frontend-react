import { toast } from 'sonner';
import React, { useState, useEffect, useCallback } from 'react';
import {  useNavigate, useLocation  } from 'react-router-dom';
import { Save, ArrowLeft, UserPlus } from 'lucide-react';
import { CreateCustomerModal } from '@/components/dashboard/create-customer-modal';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ActivityFormProps {
  activityId?: string;
}

interface Lead { id: string; name: string; }
interface Deal { id: string; name: string; }
interface Customer { id: string; name: string; }

export default function ActivityForm({ activityId }: ActivityFormProps) {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { toast } = useToast();
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(!!activityId);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Call' as 'Call' | 'Meeting',
    title: '',
    description: '',
    activityDate: new Date().toISOString().split('T')[0],
    duration: 0,
    status: 'Scheduled' as 'Scheduled' | 'Completed' | 'Cancelled',
    leadId: '',
    dealId: '',
    customerId: '',
  });

  const API_BASE = (import.meta.env.VITE_API_BASE || '').trim();
  const API_ROOT = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

  const getCookie = useCallback((name: string) => {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\\^$|?*+()[\]{}.])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }, []);

  const fetchOptions = useCallback(async () => {
    try {
      const token = getCookie('token') || getCookie('accessToken');
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'x-business-id': businessId };
      const [leadsRes, dealsRes, customersRes] = await Promise.all([
        fetch(`${API_ROOT}/leads`, { headers }),
        fetch(`${API_ROOT}/deals`, { headers }),
        fetch(`${API_ROOT}/customers`, { headers }),
      ]);

      if (leadsRes.ok) setLeads((await leadsRes.json()).leads || []);
      if (dealsRes.ok) setDeals((await dealsRes.json()).deals || []);
      if (customersRes.ok) setCustomers((await customersRes.json()).customers || []);
    } catch (error) {
      console.error('Error fetching options:', error);
    } finally {
      setIsLoadingOptions(false);
    }
  }, [API_ROOT, getCookie, businessId]);

  useEffect(() => {
    fetchOptions();
    if (activityId) {
      fetchActivity();
    } else {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const typeParam = get('type');
        if (typeParam === 'Call' || typeParam === 'Meeting') {
          setFormData(prev => ({ ...prev, type: typeParam }));
        }
      }
    }
  }, [activityId, fetchOptions]);

  const fetchActivity = async () => {
    try {
      const token = getCookie('token') || getCookie('accessToken');
      if (!token) return;

      const response = await fetch(`${API_ROOT}/activities/${activityId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'x-business-id': businessId },
      });

      if (!response.ok) throw new Error('Failed to fetch activity');

      const data = await response.json();
      if (data.success) setFormData(data.activity);
    } catch (error) {
      console.error('Error fetching activity:', error);
      toast({ title: 'Error', description: 'Failed to load activity details.', variant: 'destructive' });
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type || !formData.title || !formData.activityDate) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    try {
      setIsLoading(true);
      const token = getCookie('token') || getCookie('accessToken');
      if (!token) throw new Error('Not authenticated');

      const endpoint = activityId ? `${API_ROOT}/activities/${activityId}` : `${API_ROOT}/activities`;
      const method = activityId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'x-business-id': businessId },
        body: JSON.stringify({ ...formData, duration: Number(formData.duration) }),
      });

      if (!response.ok) throw new Error('Failed to save activity');

      toast({ title: 'Success', description: `Activity ${activityId ? 'updated' : 'created'} successfully.` });
      navigate(`/dashboard/${businessId}/activities`);
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to save activity.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingActivity || isLoadingOptions) {
    return (<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>);
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-slate-950 px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
      <div className="flex items-center gap-4 bg-card dark:bg-slate-900 p-6 rounded-2xl border border-border dark:border-slate-800 shadow-sm transition-colors">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 rounded-xl border-border dark:border-slate-700 bg-card dark:bg-slate-800 hover:bg-muted dark:hover:bg-slate-800/80 text-foreground dark:text-slate-200 cursor-pointer shadow-sm shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col leading-tight">
          <h1 className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">{activityId ? 'Edit Activity' : 'Create New Activity'}</h1>
          <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">Track interactions and follow-ups</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm transition-colors overflow-hidden">
              <div className="px-6 py-5 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-900/50">
                <h3 className="text-lg font-bold text-foreground dark:text-slate-100">Activity Details</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Type <span className="text-rose-500">*</span></label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as 'Call' | 'Meeting' })}>
                      <SelectTrigger className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                        <SelectItem value="Call" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Call</SelectItem>
                        <SelectItem value="Meeting" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Status <span className="text-rose-500">*</span></label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'Scheduled' | 'Completed' | 'Cancelled' })}>
                      <SelectTrigger className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                        <SelectItem value="Scheduled" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Scheduled</SelectItem>
                        <SelectItem value="Completed" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Completed</SelectItem>
                        <SelectItem value="Cancelled" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Title <span className="text-rose-500">*</span></label>
                  <Input placeholder="Activity title..." value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Description</label>
                  <Textarea placeholder="Notes..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="rounded-xl border-border dark:border-slate-700 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Date <span className="text-rose-500">*</span></label>
                    <Input type="date" value={formData.activityDate} onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })} required className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 [&::-webkit-calendar-picker-indicator]:dark:invert" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Duration <span className="text-slate-400 font-normal normal-case tracking-normal">(minutes)</span></label>
                    <Input type="number" placeholder="0" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })} className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 font-mono" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm transition-colors overflow-hidden">
              <div className="px-6 py-5 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-900/50">
                <h3 className="text-lg font-bold text-foreground dark:text-slate-100">Related To</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Lead</label>
                  <Select value={formData.leadId} onValueChange={(value) => setFormData({ ...formData, leadId: value })}>
                    <SelectTrigger className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"><SelectValue placeholder="Select a lead" /></SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">{leads.map((lead) => (<SelectItem key={lead.id} value={lead.id} className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">{lead.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Deal</label>
                  <Select value={formData.dealId} onValueChange={(value) => setFormData({ ...formData, dealId: value })}>
                    <SelectTrigger className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"><SelectValue placeholder="Select a deal" /></SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">{deals.map((deal) => (<SelectItem key={deal.id} value={deal.id} className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">{deal.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Customer</label>
                  <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                    <SelectTrigger className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"><SelectValue placeholder="Select a customer" /></SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id} className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">
                          {customer.name}
                        </SelectItem>
                      ))}
                      <div className="border-t border-border dark:border-slate-800 mt-1 pt-1">
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); setShowCreateCustomer(true) }}
                          className="flex w-full items-center gap-2 px-2 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors"
                        >
                          <UserPlus className="h-4 w-4" />
                          + Create Customer
                        </button>
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} className="rounded-xl h-12 px-6 border-border dark:border-slate-700 text-muted-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 font-semibold cursor-pointer w-full sm:w-auto transition-colors">Cancel</Button>
              <Button type="submit" disabled={isLoading} className="rounded-xl h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer w-full sm:w-auto transition-colors">
                <Save className="h-5 w-5" />
                {isLoading ? 'Saving...' : 'Save Activity'}
              </Button>
            </div>
          </div>
        </div>
      </form>
      <CreateCustomerModal
        open={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        businessId={businessId}
        onCreated={(newCust) => {
          setCustomers((prev) => [
            ...prev,
            {
              id: newCust.id,
              name: newCust.company || newCust.name || '',
            },
          ])
          setFormData((prev) => ({
            ...prev,
            customerId: newCust.id,
          }))
        }}
      />
    </div>
  );
}
