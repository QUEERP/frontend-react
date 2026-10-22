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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const location = useLocation();
  const pathname = location.pathname;
  const search = location.search;
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
      const params = new URLSearchParams(search);
      const typeParam = params.get('type');
      if (typeParam === 'Call' || typeParam === 'Meeting') {
        setTypeFilter(typeParam);
      } else {
        setTypeFilter('All');
      }
    }
  }, [pathname, search]);

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
      if (data.success && Array.isArray(data.data)) {
        setActivities(data.data);
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
  }, [API_ROOT, getCookie]);

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
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Clean Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {typeFilter === 'Call' ? 'Calls' : typeFilter === 'Meeting' ? 'Meetings' : 'Activities'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {typeFilter === 'Call'
              ? 'Track client phone calls and interactions'
              : typeFilter === 'Meeting'
              ? 'Track client meetings and structured schedules'
              : 'Track calls, meetings, and customer interactions'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={downloadReport} className="h-10 gap-2 bg-card hover:bg-muted text-foreground border-border shadow-sm rounded-xl font-medium px-4 cursor-pointer">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Link to={`/dashboard/${businessId}/activities/new${typeFilter !== 'All' ? `?type=${typeFilter}` : ''}`}>
            <Button className="h-10 cursor-pointer gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-xl border-none font-medium px-5">
              <Plus className="h-4 w-4" />
              New {typeFilter !== 'All' ? typeFilter : 'Activity'}
            </Button>
          </Link>
        </div>
      </div>

      <Card className="w-full min-w-0 max-w-full rounded-2xl border-border bg-card shadow-sm overflow-hidden flex-1 flex flex-col">
        <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                {typeFilter === 'Call' ? 'Calls' : typeFilter === 'Meeting' ? 'Meetings' : 'Activities'} Directory
              </CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                Showing <span className="text-foreground font-semibold">{filteredActivities.length}</span> of {activities.length} records
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by title or related contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 rounded-xl border-border bg-card w-full focus-visible:ring-blue-500 text-sm shadow-sm"
              />
            </div>
          </div>
        </CardHeader>
        <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No activities found</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Create your first {typeFilter !== 'All' ? typeFilter.toLowerCase() : 'activity'} to get started tracking interactions.
              </p>
              <Link to={`/dashboard/${businessId}/activities/new${typeFilter !== 'All' ? `?type=${typeFilter}` : ''}`}>
                <Button className="mt-4 h-10 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-medium px-5">
                  <Plus className="h-4 w-4" />
                  Create First {typeFilter !== 'All' ? typeFilter : 'Activity'}
                </Button>
              </Link>
            </div>
          ) : (
            <Table className="w-full min-w-[850px]">
              <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                  <TableHead className="pl-6 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Title</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Related To</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Duration</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="pr-6 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
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
          )}
        </div>
      </Card>

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
