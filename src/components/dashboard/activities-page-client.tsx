import { toast } from 'sonner';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {  useLocation  } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Search, Filter, MessageCircle, CheckCircle, Download, CalendarDays } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Activity {
  id: string;
  type: 'Call' | 'Meeting';
  title: string;
  description?: string;
  activityDate: string;
  duration?: number;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  leadId?: string;
  dealId?: string;
  customerId?: string;
  lead?: { name: string };
  deal?: { name: string };
  customer?: { name: string };
  createdAt: string;
}

export default function ActivitiesPageClient() {
  const pathname = useLocation().pathname;
  const { toast } = useToast();
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [typeFilter, setTypeFilter] = useState<'Call' | 'Meeting' | 'All'>('All');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get('type');
      if (typeParam === 'Call' || typeParam === 'Meeting') {
        setTypeFilter(typeParam);
      } else {
        setTypeFilter('All');
      }
    }
  }, [pathname]);

  const API_BASE = (import.meta.env.VITE_API_BASE || '').trim();
  const API_ROOT = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

  const getCookie = useCallback((name: string) => {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\\^$|?*+()[\\]{}.-])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = getCookie('token') || getCookie('accessToken');
      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to load activities.',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`${API_ROOT}/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.activities)) {
        setActivities(data.activities);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Failed to load activities',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [API_ROOT, getCookie, toast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleDeleteActivity = async (activity: Activity) => {
    try {
      const token = getCookie('token') || getCookie('accessToken');
      if (!token) return;

      const response = await fetch(`${API_ROOT}/activities/${activity.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete activity');
      }

      setActivities(activities.filter(a => a.id !== activity.id));
      toast({
        title: 'Success',
        description: 'Activity deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete activity.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedActivity(null);
    }
  };

  const filteredActivities = (activities || [])
    .filter(activity => activity && activity.type && (typeFilter === 'All' || activity.type.toLowerCase() === typeFilter.toLowerCase()))
    .filter(activity => {
      if (!activity) return false;
      const search = searchTerm.toLowerCase();
      const titleMatch = (activity.title || '').toLowerCase().includes(search);
      const descMatch = (activity.description || '').toLowerCase().includes(search);
      const leadMatch = (activity.lead?.name || '').toLowerCase().includes(search);
      const dealMatch = (activity.deal?.name || '').toLowerCase().includes(search);
      const custMatch = (activity.customer?.name || '').toLowerCase().includes(search);
      return titleMatch || descMatch || leadMatch || dealMatch || custMatch;
    });

  const getTypeIcon = (type: Activity['type']) => {
    return type === 'Call' ? '📞' : '📅';
  };
  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20';
      default:
        return 'bg-muted text-foreground dark:bg-slate-800 dark:text-slate-300 border-border dark:border-slate-700';
    }
  };

  const downloadReport = () => {
    if (activities.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const headers = ['Type', 'Title', 'Description', 'Related Lead', 'Related Deal', 'Related Customer', 'Activity Date', 'Duration (min)', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...activities.map(a => [
        `"${a.type}"`,
        `"${a.title}"`,
        `"${a.description || ''}"`,
        `"${a.lead?.name || ''}"`,
        `"${a.deal?.name || ''}"`,
        `"${a.customer?.name || ''}"`,
        new Date(a.activityDate).toLocaleDateString(),
        a.duration || 0,
        `"${a.status}"`,
        new Date(a.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Activities_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Report downloaded successfully' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-slate-950 px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card dark:bg-slate-900 p-6 rounded-2xl border border-border dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex min-w-0 items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hidden sm:block">
            {typeFilter === 'Call' ? <MessageCircle className="h-6 w-6" /> : <CalendarDays className="h-6 w-6" />}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">
              {typeFilter === 'Call' ? 'Calls' : typeFilter === 'Meeting' ? 'Meetings' : 'Activities'}
            </span>
            <span className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">
              {typeFilter === 'Call'
                ? 'Track client phone calls and interactions'
                : typeFilter === 'Meeting'
                ? 'Track client meetings and structured schedules'
                : 'Track calls, meetings, and customer interactions'}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={downloadReport} className="h-10 rounded-xl border-border dark:border-slate-700 bg-card dark:bg-slate-800 hover:bg-muted dark:hover:bg-slate-800/80 text-foreground dark:text-slate-200 font-semibold gap-2 shadow-sm cursor-pointer transition-colors">
            <Download className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            Export
          </Button>
          <Link to={`/dashboard/${businessId}/activities/new${typeFilter !== 'All' ? `?type=${typeFilter}` : ''}`}>
            <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer transition-colors">
              <Plus className="h-4 w-4" />
              New {typeFilter !== 'All' ? typeFilter : 'Activity'}
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between border-b border-border dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted dark:bg-slate-800/50 text-muted-foreground dark:text-slate-400 rounded-lg">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                Directory
                <span className="bg-muted dark:bg-slate-800 text-muted-foreground dark:text-slate-300 font-semibold px-2 py-0.5 rounded-md text-xs">
                  {filteredActivities.length}
                </span>
              </h2>
            </div>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-muted-foreground" />
            <Input
              placeholder="Search by title or related contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl border-border dark:border-slate-700 bg-muted dark:bg-slate-950 focus-visible:ring-blue-500 dark:text-slate-100 transition-colors shadow-sm"
            />
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="p-4 bg-muted dark:bg-slate-800/50 rounded-full mb-4">
              <MessageCircle className="h-8 w-8 text-slate-400 dark:text-muted-foreground" />
            </div>
            <h3 className="text-base font-bold text-foreground dark:text-slate-200">No activities found</h3>
            <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400 max-w-sm">
              Create your first {typeFilter !== 'All' ? typeFilter.toLowerCase() : 'activity'} to get started tracking interactions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/80 dark:bg-slate-900/50">
                <TableRow className="hover:bg-background border-border dark:border-slate-800">
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-6">Type</TableHead>
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">Title</TableHead>
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">Related To</TableHead>
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">Date</TableHead>
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">Duration</TableHead>
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">Status</TableHead>
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/30 border-border dark:border-slate-800 transition-colors">
                    <TableCell className="px-6 py-4 text-xl">
                      {getTypeIcon(activity.type)}
                    </TableCell>
                    <TableCell className="px-4 py-4 font-bold text-sm text-foreground dark:text-slate-200">
                      {activity.title}
                    </TableCell>
                    <TableCell className="px-4 py-4 flex flex-wrap gap-1.5">
                      {activity.lead?.name && <span className="bg-muted dark:bg-slate-800 border border-border dark:border-slate-700 text-muted-foreground dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">Lead: {activity.lead.name}</span>}
                      {activity.deal?.name && <span className="bg-muted dark:bg-slate-800 border border-border dark:border-slate-700 text-muted-foreground dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">Deal: {activity.deal.name}</span>}
                      {activity.customer?.name && <span className="bg-muted dark:bg-slate-800 border border-border dark:border-slate-700 text-muted-foreground dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">Customer: {activity.customer.name}</span>}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm font-medium text-muted-foreground dark:text-slate-400">
                      {new Date(activity.activityDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm font-medium text-muted-foreground dark:text-slate-400">
                      {activity.duration ? `${activity.duration} min` : '-'}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <span className={`px-2 py-0.5 border rounded-md text-[10px] uppercase tracking-wider font-bold shadow-sm ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={`/dashboard/${businessId}/activities/${activity.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-500/10 rounded-lg">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/dashboard/${businessId}/activities/${activity.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-500/10 rounded-lg">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg cursor-pointer"
                          onClick={() => {
                            setSelectedActivity(activity);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl dark:bg-slate-900 dark:border-slate-800">
          <AlertDialogTitle className="dark:text-slate-100">Delete Activity</AlertDialogTitle>
          <AlertDialogDescription className="dark:text-slate-400">
            Are you sure you want to delete <span className="font-semibold text-foreground dark:text-slate-200">{selectedActivity?.title}</span>? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end mt-4">
            <AlertDialogCancel className="rounded-xl border-border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 m-0 cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedActivity && handleDeleteActivity(selectedActivity)}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer m-0"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
