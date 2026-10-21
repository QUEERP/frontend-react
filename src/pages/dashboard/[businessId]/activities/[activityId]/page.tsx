import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit2, 
  Calendar, 
  Clock, 
  User, 
  Building, 
  Briefcase, 
  Phone, 
  CalendarDays, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { API_ROOT } from '@/config/api';
import { getCookie } from '@/lib/utils';

interface ActivityDetails {
  id: string;
  type: string;
  title: string;
  description?: string;
  activityDate: string;
  duration?: number;
  status: string;
  leadId?: string;
  dealId?: string;
  customerId?: string;
  contactId?: string;
  lead?: { id: string; name: string };
  deal?: { id: string; name: string };
  customer?: { id: string; company?: string; name?: string };
  contact?: { id: string; fullName?: string; name?: string };
  assignedTo?: { user?: { name?: string; email?: string } };
  createdAt: string;
  updatedAt?: string;
}

const formatDateSafe = (dateVal: any) => {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  } catch {
    return '—';
  }
};

export default function ActivityDetailsPage() {
  const routerParams = useParams() as any;
  const businessId = routerParams.businessId || '';
  const activityId = routerParams.activityId || routerParams.id || '';
  const navigate = useNavigate();

  const [activity, setActivity] = useState<ActivityDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      const token = getCookie('token') || getCookie('accessToken');
      if (!token) {
        toast.error('Authentication required');
        setLoading(false);
        return;
      }

      if (!activityId) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_ROOT}/activities/${activityId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load activity details: ${response.status}`);
      }

      const data = await response.json();
      const item = data.data || data.activity;
      if (item) {
        setActivity(item);
      } else {
        toast.error('Activity not found');
      }
    } catch (err) {
      console.error('Error fetching activity details:', err);
      toast.error('Failed to load activity details');
    } finally {
      setLoading(false);
    }
  }, [activityId, businessId]);

  useEffect(() => {
    if (activityId) {
      fetchActivity();
    } else {
      setLoading(false);
    }
  }, [activityId, fetchActivity]);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') {
      return (
        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5 px-3 py-1 font-bold text-xs uppercase tracking-wider">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Completed
        </Badge>
      );
    }
    if (s === 'cancelled') {
      return (
        <Badge variant="outline" className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 flex items-center gap-1.5 px-3 py-1 font-bold text-xs uppercase tracking-wider">
          <XCircle className="h-3.5 w-3.5" />
          Cancelled
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 flex items-center gap-1.5 px-3 py-1 font-bold text-xs uppercase tracking-wider">
        <Clock className="h-3.5 w-3.5" />
        {status || 'Scheduled'}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'call') return <Phone className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
    return <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
  };

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-sm font-medium text-muted-foreground">Loading activity details...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-4">
        <div className="p-4 bg-muted dark:bg-slate-800 rounded-full">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Activity Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested activity could not be loaded or may have been deleted.</p>
        <Button onClick={() => navigate(`/dashboard/${businessId}/activities`)} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Activities
        </Button>
      </div>
    );
  }

  const relatedEntities = [];
  if (activity.lead?.name) relatedEntities.push({ label: 'Lead', value: activity.lead.name, icon: User });
  if (activity.deal?.name) relatedEntities.push({ label: 'Deal', value: activity.deal.name, icon: Briefcase });
  if (activity.customer?.company || activity.customer?.name) {
    relatedEntities.push({ label: 'Customer', value: activity.customer.company || activity.customer.name || '', icon: Building });
  }
  if (activity.contact?.fullName || activity.contact?.name) {
    relatedEntities.push({ label: 'Contact', value: activity.contact.fullName || activity.contact.name || '', icon: UserCheck });
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-slate-950 px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card dark:bg-slate-900 p-6 rounded-2xl border border-border dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex min-w-0 items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/dashboard/${businessId}/activities`)}
            className="rounded-xl h-10 w-10 border-border dark:border-slate-800 bg-card dark:bg-slate-900 hover:bg-muted shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl hidden sm:block">
            {getTypeIcon(activity.type)}
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight truncate">
                {activity.title}
              </h1>
              {getStatusBadge(activity.status)}
            </div>
            <span className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-1">
              {activity.type} &middot; Created on {formatDateSafe(activity.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
          <Link to={`/dashboard/${businessId}/activities/${activity.id}/edit`}>
            <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer">
              <Edit2 className="h-4 w-4" />
              Edit Activity
            </Button>
          </Link>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm">
            <CardHeader className="pb-3 border-b border-border dark:border-slate-800">
              <CardTitle className="text-base font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Activity Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
                  Title
                </span>
                <p className="text-base font-semibold text-foreground dark:text-slate-100 mt-1">
                  {activity.title}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
                  Description / Notes
                </span>
                <p className="text-sm text-foreground dark:text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed bg-muted/40 dark:bg-slate-950 p-4 rounded-xl border border-border dark:border-slate-800">
                  {activity.description ? activity.description : 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-border dark:border-slate-800 bg-muted/20 dark:bg-slate-950/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    Date
                  </span>
                  <p className="text-sm font-semibold text-foreground dark:text-slate-200 mt-1.5">
                    {formatDateSafe(activity.activityDate)}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border dark:border-slate-800 bg-muted/20 dark:bg-slate-950/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    Duration
                  </span>
                  <p className="text-sm font-semibold text-foreground dark:text-slate-200 mt-1.5">
                    {activity.duration ? `${activity.duration} mins` : '—'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border dark:border-slate-800 bg-muted/20 dark:bg-slate-950/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Status
                  </span>
                  <p className="text-sm font-semibold text-foreground dark:text-slate-200 mt-1.5">
                    {activity.status}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Relationships & Assignment */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm">
            <CardHeader className="pb-3 border-b border-border dark:border-slate-800">
              <CardTitle className="text-base font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-purple-500" />
                Related Entities
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {relatedEntities.length === 0 ? (
                <p className="text-sm text-muted-foreground dark:text-slate-400 font-medium">
                  No linked Lead, Deal, or Customer account.
                </p>
              ) : (
                relatedEntities.map((ent, idx) => {
                  const Icon = ent.icon;
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border dark:border-slate-800 bg-muted/20 dark:bg-slate-950/50">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 block">
                            {ent.label}
                          </span>
                          <span className="text-sm font-semibold text-foreground dark:text-slate-200">
                            {ent.value}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm">
            <CardHeader className="pb-3 border-b border-border dark:border-slate-800">
              <CardTitle className="text-base font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                <User className="h-4 w-4 text-teal-500" />
                Assigned Team Member
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {activity.assignedTo?.user ? (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm">
                    {activity.assignedTo.user.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground dark:text-slate-200">
                      {activity.assignedTo.user.name || 'Assigned User'}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-slate-400">
                      {activity.assignedTo.user.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground dark:text-slate-400 font-medium">
                  Unassigned
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
