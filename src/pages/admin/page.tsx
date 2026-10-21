import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  CreditCardIcon,
  Building2Icon,
  UsersIcon,
  UserCheckIcon,
  UserPlus,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  ExternalLink,
  PlusCircle,
  Check,
  Copy,
  TrendingUp,
  Crown,
  Key,
  Trash2,
  FolderPlus,
  ChevronDownIcon,
  Plus,
  SettingsIcon,
  Filter,
  ActivityIcon,
  CalendarDaysIcon,
  SlidersHorizontal,
  FileTextIcon
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { DashboardThemeProvider } from '@/components/dashboard/dashboard-theme-provider';
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle';
import { toast } from 'sonner';
import { getCookie, clearCookie } from '@/lib/utils';
import { clearAuthSession, isSubscriptionAdminUser } from '@/lib/auth';

// Types
interface SubscriptionStats {
  totalBusinesses: number;
  activeBusinesses: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  inactiveSubscriptions: number;
  expiringSoon: number;
  statusBreakdown: {
    ACTIVE: number;
    EXPIRED: number;
    INACTIVE: number;
  };
  planBreakdown: Record<string, number>;
}

interface SubscriptionItem {
  id: string;
  businessId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  startDate: string | null;
  expiresAt: string | null;
  planName: string | null;
  notes: string | null;
  createdAt: string;
  remainingDays: number | null;
  isActive: boolean;
  business?: {
    id: string;
    name: string;
    legalName?: string | null;
    countryCode?: string | null;
    currencyCode?: string | null;
    isActive: boolean;
    createdAt: string;
    owner?: { id: string; name: string; email: string };
    _count?: { users: number; invoices: number };
  };
}

interface BusinessItem {
  id: string;
  name: string;
  legalName?: string | null;
  countryCode?: string | null;
  currencyCode?: string | null;
  isActive: boolean;
  createdAt: string;
  allocatedModules?: string[];
  owner?: { id: string; name: string; email: string };
  subscription?: {
    id: string;
    status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
    startDate: string | null;
    expiresAt: string | null;
    planName: string | null;
    notes: string | null;
    remainingDays: number | null;
    isActuallyActive: boolean;
  } | null;
  _count?: {
    users: number;
    invoices: number;
    bills: number;
    customers: number;
  };
}

export const ALLOCATABLE_MODULES = [
  {
    id: 'sales',
    name: 'Sales & CRM',
    description: 'Leads, Deals, Customers, Quotations, Sales Orders, Invoices, Payments, Credit Notes & Returns',
    category: 'Revenue',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'procurement',
    name: 'Procurement & Purchases',
    description: 'Vendors, Purchase Orders, Bills, GRN, Vendor Payments & Purchase Returns',
    category: 'Supply',
    badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'inventory',
    name: 'Inventory & Warehouse',
    description: 'Products catalog, Stock management, Multiple Warehouses, Tracking & Stock valuation',
    category: 'Operations',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'accounting',
    name: 'Accounting & Finance',
    description: 'Chart of Accounts, Journal Entries, Expenses tracking, Financial Statements & Reporting',
    category: 'Finance',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'hr',
    name: 'HR & Payroll',
    description: 'Employees directory, Attendance, Payroll runs, Leave requests, Overtime & Staff loans',
    category: 'Human Resources',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'project_operations',
    name: 'Project Operations',
    description: 'Project lifecycle, Task boards, Milestones tracking, Timesheets & Pre-sales operations',
    category: 'Delivery',
    badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'statutory',
    name: 'Statutory Reports & Tax',
    description: 'Statutory compliance dashboard, Tax filing registers, Sales/Purchase tax registers',
    category: 'Compliance',
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  {
    id: 'user_management',
    name: 'User Management',
    description: 'Business member directory, User invitations, Custom Roles & Permission matrix',
    category: 'Security',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
  {
    id: 'contracts',
    name: 'Contracts',
    description: 'Contract management, Terms, Renewal dates & Approvals',
    category: 'Legal',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
];

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  memberships?: Array<{
    business?: { id: string; name: string };
    role?: { id: string; name: string };
  }>;
  businessesOwned?: Array<{ id: string; name: string }>;
}

interface ErpModule {
  id: string;
  name: string;
  actions: string[];
}

export type AdminView =
  | 'overview'
  | 'subs_all'
  | 'subs_active'
  | 'subs_expiring'
  | 'subs_expired'
  | 'subs_analytics'
  | 'biz_all'
  | 'biz_active'
  | 'biz_disabled'
  | 'users_all'
  | 'users_admins'
  | 'users_members'
  | 'modules_all';

// Date formatting helper
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const API_BASE = import.meta.env.VITE_API_BASE || '';

  // Current selected view in dashboard
  const currentView = (searchParams.get('view') as AdminView) || 'overview';
  const setView = (v: AdminView) => setSearchParams({ view: v });

  // Sidebar collapsible states
  const [isSubsOpen, setIsSubsOpen] = useState(true);
  const [isBizOpen, setIsBizOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isModulesOpen, setIsModulesOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [modules, setModules] = useState<ErpModule[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter inputs
  const [searchTerm, setSearchTerm] = useState('');
  const [subPlanFilter, setSubPlanFilter] = useState('ALL');

  // Modals
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [editPlanModalOpen, setEditPlanModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [targetBusinessForModules, setTargetBusinessForModules] = useState<BusinessItem | null>(null);
  const [selectedAllocatedModules, setSelectedAllocatedModules] = useState<string[]>([]);
  const [isSavingModules, setIsSavingModules] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [createModuleModalOpen, setCreateModuleModalOpen] = useState(false);
  const [deleteModuleModalOpen, setDeleteModuleModalOpen] = useState(false);

  // Action states
  const [selectedBusiness, setSelectedBusiness] = useState<{ id: string; name: string; currentPlan?: string | null; expiresAt?: string | null; notes?: string | null } | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(12);
  const [durationUnit, setDurationUnit] = useState<'days' | 'months'>('days');
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [extendUnit, setExtendUnit] = useState<'days' | 'months'>('days');
  const [extendDays, setExtendDays] = useState<number>(30);
  const [selectedPlan, setSelectedPlan] = useState<string>('Professional');
  const [customPlan, setCustomPlan] = useState<string>('');
  const [editPlanTier, setEditPlanTier] = useState<string>('Professional');
  const [editCustomPlan, setEditCustomPlan] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editKeepExpiry, setEditKeepExpiry] = useState<boolean>(true);
  const [editExpiryDate, setEditExpiryDate] = useState<string>('');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New user form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('USER');

  // Module form
  const [moduleFormName, setModuleFormName] = useState('');
  const [moduleFormActions, setModuleFormActions] = useState<string[]>(['read', 'create', 'update', 'delete']);
  const [activeModuleForDelete, setActiveModuleForDelete] = useState<ErpModule | null>(null);

  // Token retrieval
  const getAuthToken = useCallback(() => {
    return getCookie('token') || localStorage.getItem('token') || '';
  }, []);

  // Auth Guard
  useEffect(() => {
    const token = getAuthToken();
    if (!token || !isSubscriptionAdminUser(token)) {
      toast.error('Authentication required. Please sign in as Subscription Admin.');
      clearAuthSession();
      navigate('/signin');
    }
  }, [getAuthToken, navigate]);

  // Load all dashboard data
  const fetchAllData = useCallback(async (quiet = false) => {
    const token = getAuthToken();
    if (!token) return;

    if (!quiet) setIsLoading(true);
    setIsRefreshing(true);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const [statsRes, subsRes, bizRes, usersRes, modsRes] = await Promise.all([
        fetch(`${API_BASE}/api/subscriptions/stats`, { headers }),
        fetch(`${API_BASE}/api/subscriptions/all?limit=200`, { headers }),
        fetch(`${API_BASE}/api/subscriptions/businesses?limit=200`, { headers }),
        fetch(`${API_BASE}/api/subscriptions/users?limit=200`, { headers }),
        fetch(`${API_BASE}/api/modules`, { headers }),
      ]);

      if (statsRes.status === 401 || subsRes.status === 401 || statsRes.status === 403 || subsRes.status === 403) {
        toast.error('Session expired. Please sign in again.');
        clearAuthSession();
        navigate('/signin');
        return;
      }

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.data || null);
      }
      if (subsRes.ok) {
        const d = await subsRes.json();
        setSubscriptions(d.data || []);
      }
      if (bizRes.ok) {
        const d = await bizRes.json();
        setBusinesses(d.data?.businesses || []);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        setUsers(d.data?.users || []);
      }
      if (modsRes.ok) {
        const d = await modsRes.json();
        setModules(d.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [API_BASE, getAuthToken, navigate]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Sign out
  const handleLogout = () => {
    clearAuthSession();
    toast.success('Signed out successfully');
    navigate('/signin');
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Action: Activate
  const handleActivateSubmit = async () => {
    if (!selectedBusiness) {
      toast.error('Please select a target business');
      return;
    }
    if (durationUnit === 'days' && (!selectedDays || selectedDays < 1)) {
      toast.error('Please specify a valid duration in days (at least 1 day)');
      return;
    }
    if (durationUnit === 'months' && (!selectedDuration || selectedDuration < 1)) {
      toast.error('Please specify a valid duration in months (at least 1 month)');
      return;
    }
    setIsSubmitting(true);
    const token = getAuthToken();

    try {
      const planToApply = selectedPlan === 'Custom' ? customPlan : selectedPlan;
      const res = await fetch(`${API_BASE}/api/subscriptions/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          durationDays: durationUnit === 'days' ? Number(selectedDays) : undefined,
          durationMonths: durationUnit === 'months' ? Number(selectedDuration) : undefined,
          planName: planToApply || 'Professional',
          notes: actionNotes || `Activated via Subscription Admin Dashboard (${durationUnit === 'days' ? `${selectedDays} days` : `${selectedDuration} mo`})`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Activation failed');

      toast.success(`Subscription activated for ${selectedBusiness.name}. Day count started!`);
      setActivateModalOpen(false);
      resetActionState();
      fetchAllData(true);
    } catch (err: any) {
      toast.error(err.message || 'Activation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Extend
  const handleExtendSubmit = async () => {
    if (!selectedBusiness) return;
    if (extendUnit === 'days' && (!extendDays || extendDays < 1)) {
      toast.error('Please specify a valid extension in days');
      return;
    }
    if (extendUnit === 'months' && (!selectedDuration || selectedDuration < 1)) {
      toast.error('Please specify a valid extension in months');
      return;
    }
    setIsSubmitting(true);
    const token = getAuthToken();

    try {
      const planToApply = selectedPlan === 'Custom' ? customPlan : selectedPlan;
      const res = await fetch(`${API_BASE}/api/subscriptions/extend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          durationDays: extendUnit === 'days' ? Number(extendDays) : undefined,
          durationMonths: extendUnit === 'months' ? Number(selectedDuration) : undefined,
          planName: planToApply || selectedBusiness.currentPlan || 'Professional',
          notes: actionNotes || `Extended via Subscription Admin Dashboard (${extendUnit === 'days' ? `+${extendDays} days` : `+${selectedDuration} mo`})`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Extension failed');

      toast.success(`Subscription extended for ${selectedBusiness.name}`);
      setExtendModalOpen(false);
      resetActionState();
      fetchAllData(true);
    } catch (err: any) {
      toast.error(err.message || 'Extension failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Edit Plan
  const handleEditPlanSubmit = async () => {
    if (!selectedBusiness) {
      toast.error('No business selected');
      return;
    }

    const planToApply = editPlanTier === 'Custom' ? editCustomPlan.trim() : editPlanTier;
    if (!planToApply) {
      toast.error('Please enter a valid plan name');
      return;
    }

    setIsSubmitting(true);
    const token = getAuthToken();

    try {
      const payload: {
        businessId: string;
        planName: string;
        notes?: string;
        expiresAt?: string;
      } = {
        businessId: selectedBusiness.id,
        planName: planToApply,
        notes: editNotes,
      };

      if (!editKeepExpiry && editExpiryDate) {
        payload.expiresAt = new Date(editExpiryDate).toISOString();
      }

      const res = await fetch(`${API_BASE}/api/subscriptions/update-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update plan');
      }

      toast.success(`Plan updated to "${planToApply}" for ${selectedBusiness.name}`);
      setEditPlanModalOpen(false);
      resetActionState();
      fetchAllData(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open allocate modules modal for business
  const openAllocateModal = (biz: BusinessItem) => {
    setTargetBusinessForModules(biz);
    if (biz.allocatedModules && biz.allocatedModules.length > 0) {
      setSelectedAllocatedModules([...biz.allocatedModules]);
    } else {
      setSelectedAllocatedModules(ALLOCATABLE_MODULES.map(m => m.id));
    }
    setAllocateModalOpen(true);
  };

  // Save allocated modules
  const handleSaveAllocatedModules = async () => {
    if (!targetBusinessForModules) {
      toast.error('No business selected');
      return;
    }
    if (selectedAllocatedModules.length === 0) {
      toast.error('Please allocate at least one module to this business');
      return;
    }

    setIsSavingModules(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_BASE}/api/subscriptions/businesses/allocate-modules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: targetBusinessForModules.id,
          modules: selectedAllocatedModules,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to allocate modules');
      }

      toast.success(`Allocated ${selectedAllocatedModules.length} modules to ${targetBusinessForModules.name}`);
      setAllocateModalOpen(false);
      setTargetBusinessForModules(null);
      fetchAllData(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to allocate modules');
    } finally {
      setIsSavingModules(false);
    }
  };

  // Action: Deactivate
  const handleDeactivateSubmit = async () => {
    if (!selectedBusiness) return;
    setIsSubmitting(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_BASE}/api/subscriptions/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessId: selectedBusiness.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Deactivation failed');

      toast.success(`Subscription deactivated for ${selectedBusiness.name}`);
      setDeactivateModalOpen(false);
      resetActionState();
      fetchAllData(true);
    } catch (err: any) {
      toast.error(err.message || 'Deactivation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Toggle Business status
  const handleToggleBusiness = async (biz: BusinessItem) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE}/api/subscriptions/businesses/toggle-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessId: biz.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to toggle status');

      toast.success(`Business ${data.data?.isActive ? 'enabled' : 'disabled'}: ${biz.name}`);
      fetchAllData(true);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  // Action: Toggle User status
  const handleToggleUserStatus = async (user: PlatformUser) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE}/api/subscriptions/users/toggle-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update user');

      toast.success(`User ${data.data?.isActive ? 'activated' : 'deactivated'}: ${user.name}`);
      fetchAllData(true);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  // Action: Create User
  const handleCreateUserSubmit = async () => {
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast.error('Please enter name, email, and password');
      return;
    }
    setIsSubmitting(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_BASE}/api/subscriptions/users/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'User creation failed');

      toast.success(`User ${data.data?.name} created successfully`);
      setCreateUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('USER');
      fetchAllData(true);
    } catch (err: any) {
      toast.error(err.message || 'Creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Create Module
  const handleCreateModuleSubmit = async () => {
    if (!moduleFormName.trim() || !moduleFormActions.length) {
      toast.error('Module name and at least one action are required');
      return;
    }
    setIsSubmitting(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_BASE}/api/modules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: moduleFormName.trim(),
          actions: moduleFormActions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Module creation failed');

      toast.success(`Module "${moduleFormName}" created successfully`);
      setCreateModuleModalOpen(false);
      setModuleFormName('');
      setModuleFormActions(['read', 'create', 'update', 'delete']);
      fetchAllData(true);
    } catch (err: any) {
      toast.error(err.message || 'Creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Delete Module
  const handleDeleteModuleSubmit = async () => {
    if (!activeModuleForDelete) return;
    setIsSubmitting(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_BASE}/api/modules/${activeModuleForDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Module deletion failed');

      toast.success(`Module "${activeModuleForDelete.name}" deleted`);
      setDeleteModuleModalOpen(false);
      setActiveModuleForDelete(null);
      fetchAllData(true);
    } catch (err: any) {
      toast.error(err.message || 'Deletion failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetActionState = () => {
    setSelectedBusiness(null);
    setSelectedDuration(12);
    setSelectedDays(30);
    setDurationUnit('days');
    setExtendDays(30);
    setExtendUnit('days');
    setSelectedPlan('Professional');
    setCustomPlan('');
    setEditPlanTier('Professional');
    setEditCustomPlan('');
    setEditNotes('');
    setEditKeepExpiry(true);
    setEditExpiryDate('');
    setActionNotes('');
  };

  const activationValidityPreview = useMemo(() => {
    const start = new Date();
    const end = new Date(start);
    if (durationUnit === 'days') {
      end.setDate(end.getDate() + (Number(selectedDays) || 0));
    } else {
      end.setMonth(end.getMonth() + (Number(selectedDuration) || 0));
    }
    const daysTotal = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      startFormatted: formatDate(start.toISOString()),
      endFormatted: formatDate(end.toISOString()),
      daysTotal,
    };
  }, [durationUnit, selectedDays, selectedDuration]);

  const extendValidityPreview = useMemo(() => {
    const now = new Date();
    let baseDate = now;
    if (selectedBusiness?.expiresAt && new Date(selectedBusiness.expiresAt) > now) {
      baseDate = new Date(selectedBusiness.expiresAt);
    }
    const newEnd = new Date(baseDate);
    if (extendUnit === 'days') {
      newEnd.setDate(newEnd.getDate() + (Number(extendDays) || 0));
    } else {
      newEnd.setMonth(newEnd.getMonth() + (Number(selectedDuration) || 0));
    }
    return {
      currentExpiryFormatted: selectedBusiness?.expiresAt ? formatDate(selectedBusiness.expiresAt) : 'Today',
      newExpiryFormatted: formatDate(newEnd.toISOString()),
      addedText: extendUnit === 'days' ? `${extendDays} days` : `${selectedDuration} months`,
    };
  }, [selectedBusiness, extendUnit, extendDays, selectedDuration]);

  // Filtered lists based on currentView and searchTerm
  const displayedSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      const bizName = sub.business?.name?.toLowerCase() || '';
      const notes = sub.notes?.toLowerCase() || '';
      const plan = sub.planName?.toLowerCase() || '';
      const term = searchTerm.toLowerCase().trim();

      const matchesSearch = !term || bizName.includes(term) || notes.includes(term) || plan.includes(term) || sub.businessId.includes(term);
      const matchesPlan = subPlanFilter === 'ALL' || sub.planName === subPlanFilter;

      let matchesViewStatus = true;
      if (currentView === 'subs_active') {
        matchesViewStatus = sub.status === 'ACTIVE' && sub.expiresAt !== null && sub.remainingDays !== null && sub.remainingDays > 0;
      } else if (currentView === 'subs_expiring') {
        matchesViewStatus = sub.status === 'ACTIVE' && sub.expiresAt !== null && sub.remainingDays !== null && sub.remainingDays <= 7 && sub.remainingDays >= 0;
      } else if (currentView === 'subs_expired') {
        matchesViewStatus = sub.status === 'EXPIRED' || sub.status === 'INACTIVE' || !sub.expiresAt || (sub.remainingDays !== null && sub.remainingDays <= 0);
      }

      return matchesSearch && matchesPlan && matchesViewStatus;
    });
  }, [subscriptions, searchTerm, subPlanFilter, currentView]);

  const displayedBusinesses = useMemo(() => {
    return businesses.filter(b => {
      const name = b.name.toLowerCase();
      const legal = (b.legalName || '').toLowerCase();
      const ownerName = (b.owner?.name || '').toLowerCase();
      const ownerEmail = (b.owner?.email || '').toLowerCase();
      const term = searchTerm.toLowerCase().trim();

      const matchesSearch = !term || name.includes(term) || legal.includes(term) || ownerName.includes(term) || ownerEmail.includes(term) || b.id.includes(term);

      let matchesView = true;
      if (currentView === 'biz_active') {
        matchesView = b.isActive;
      } else if (currentView === 'biz_disabled') {
        matchesView = !b.isActive;
      }

      return matchesSearch && matchesView;
    });
  }, [businesses, searchTerm, currentView]);

  const displayedUsers = useMemo(() => {
    return users.filter(u => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const term = searchTerm.toLowerCase().trim();

      const matchesSearch = !term || name.includes(term) || email.includes(term);

      let matchesView = true;
      if (currentView === 'users_admins') {
        matchesView = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
      } else if (currentView === 'users_members') {
        matchesView = u.role === 'USER' || u.role === 'EMPLOYEE';
      }

      return matchesSearch && matchesView;
    });
  }, [users, searchTerm, currentView]);

  const displayedModules = useMemo(() => {
    return modules.filter(m => {
      const name = m.name.toLowerCase();
      const term = searchTerm.toLowerCase().trim();
      return !term || name.includes(term);
    });
  }, [modules, searchTerm]);

  const availablePlans = useMemo(() => {
    const set = new Set<string>();
    subscriptions.forEach(s => {
      if (s.planName) set.add(s.planName);
    });
    return Array.from(set);
  }, [subscriptions]);

  // Helpers
  const getStatusBadge = (status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE', remainingDays?: number | null, expiresAt?: string | null) => {
    if (status === 'ACTIVE' && expiresAt && (remainingDays === null || remainingDays === undefined || remainingDays > 0)) {
      const isUrgent = remainingDays !== null && remainingDays !== undefined && remainingDays <= 7;
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          isUrgent 
            ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' 
            : 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
        }`}>
          <span className={`size-1.5 rounded-full ${isUrgent ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          ACTIVE {isUrgent ? '(Expiring Soon)' : ''}
        </span>
      );
    }
    if (status === 'EXPIRED' || (remainingDays !== null && remainingDays !== undefined && remainingDays <= 0 && expiresAt)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
          <span className="size-1.5 rounded-full bg-rose-500" />
          EXPIRED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
        <span className="size-1.5 rounded-full bg-slate-400" />
        PENDING ACTIVATION
      </span>
    );
  };

  const getPlanBadge = (planName?: string | null) => {
    const plan = planName || 'Standard';
    const lower = plan.toLowerCase();

    if (lower.includes('enterprise') || lower.includes('custom')) {
      return <Badge variant="secondary" className="bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 font-bold">{plan}</Badge>;
    }
    if (lower.includes('premium') || lower.includes('growth')) {
      return <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 font-bold">{plan}</Badge>;
    }
    if (lower.includes('pro')) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 font-bold">{plan}</Badge>;
    }
    return <Badge variant="outline" className="bg-muted text-foreground border-border font-medium">{plan}</Badge>;
  };

  // Section titles
  const viewHeadings: Record<AdminView, { title: string; subtitle: string }> = {
    overview: { title: 'Dashboard', subtitle: 'Platform telemetry, business health, and license stats' },
    subs_all: { title: 'All Subscriptions', subtitle: 'Complete registry of tenant subscriptions and license terms' },
    subs_active: { title: 'Active Subscriptions', subtitle: 'Currently active tenant licenses in good standing' },
    subs_expiring: { title: 'Expiring Soon (Next 7 Days)', subtitle: 'Licenses requiring urgent renewal attention' },
    subs_expired: { title: 'Expired & Suspended Licenses', subtitle: 'Lapsed or deactivated tenant subscriptions' },
    subs_analytics: { title: 'Tier Distribution & Analytics', subtitle: 'Adoption rates across Starter, Professional, and Enterprise tiers' },
    biz_all: { title: 'All Tenant Businesses', subtitle: 'Directory of all multi-tenant organizations on QueErp' },
    biz_active: { title: 'Active Businesses', subtitle: 'Tenants with live access enabled' },
    biz_disabled: { title: 'Disabled Businesses', subtitle: 'Suspended tenant accounts with access revoked' },
    users_all: { title: 'All Platform Users', subtitle: 'Complete directory of registered user accounts' },
    users_admins: { title: 'Platform & Tenant Administrators', subtitle: 'Users with administrative privileges' },
    users_members: { title: 'Standard Users & Employees', subtitle: 'Standard workforce and tenant members' },
    modules_all: { title: 'ERP Modules Management', subtitle: 'System-wide module registry and capabilities' },
  };

  const isSubsCategory = currentView.startsWith('subs_');
  const isBizCategory = currentView.startsWith('biz_');
  const isUsersCategory = currentView.startsWith('users_');
  const isModulesCategory = currentView.startsWith('modules_');

  return (
    <DashboardThemeProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
          
          {/* ── LEFT SIDEBAR (Matching AppSidebar Layout & Styling) ── */}
          <Sidebar collapsible="offcanvas" className="border-r border-border bg-card dark:bg-[#15171a] dark:border-[#23272c]">
            {/* Header Context matching AppSidebar */}
            <SidebarHeader className="gap-3 px-3 py-3">
              <div className="h-auto w-full rounded-xl border border-blue-100 bg-card text-left text-xs shadow-sm py-3.5 px-4 dark:bg-[#15171a] dark:border-[#23272c]">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm shrink-0">
                    Q
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-bold text-foreground">QueErp Admin</span>
                      <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400 py-0 px-1">
                        Super
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate">Subscription & Core Hub</span>
                  </div>
                </div>
              </div>
            </SidebarHeader>

            <SidebarSeparator className="mx-0" />

            {/* Sidebar Content Menus */}
            <SidebarContent className="px-2 py-2">
              <SidebarMenu>
                {/* 1. Dashboard Overview */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="rounded-xl my-0.5 cursor-pointer"
                    isActive={currentView === 'overview'}
                    onClick={() => setView('overview')}
                    tooltip="Dashboard"
                  >
                    <LayoutDashboardIcon className="size-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-xs">Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* 2. Subscriptions */}
                <SidebarMenuItem>
                  <Collapsible open={isSubsOpen} onOpenChange={setIsSubsOpen}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={`rounded-xl my-0.5 cursor-pointer ${isSubsCategory ? 'bg-blue-50/60 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : ''}`}
                        tooltip="Subscriptions"
                      >
                        <CreditCardIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-semibold text-xs flex-1 text-left">Subscriptions</span>
                        <ChevronDownIcon className={`size-3.5 transition-transform duration-200 ${isSubsOpen ? 'rotate-180' : ''}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            size="sm"
                            isActive={currentView === 'subs_all'}
                            onClick={() => setView('subs_all')}
                            className="cursor-pointer text-xs"
                          >
                            <span>All Subscriptions</span>
                            <span className="ml-auto font-mono text-[10px] bg-muted text-muted-foreground px-1.5 py-0.2 rounded-full">
                              {subscriptions.length}
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            size="sm"
                            isActive={currentView === 'subs_active'}
                            onClick={() => setView('subs_active')}
                            className="cursor-pointer text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              <span>Active Licenses</span>
                            </span>
                            <span className="ml-auto font-mono text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded-full">
                              {stats?.activeSubscriptions ?? 0}
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            size="sm"
                            isActive={currentView === 'subs_expiring'}
                            onClick={() => setView('subs_expiring')}
                            className="cursor-pointer text-xs text-amber-600 dark:text-amber-400 font-medium"
                          >
                            <span className="flex items-center gap-1.5">
                              <Clock className="size-3" />
                              <span>Expiring Soon</span>
                            </span>
                            {(stats?.expiringSoon ?? 0) > 0 && (
                              <span className="ml-auto font-mono text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-bold">
                                {stats?.expiringSoon}
                              </span>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            size="sm"
                            isActive={currentView === 'subs_expired'}
                            onClick={() => setView('subs_expired')}
                            className="cursor-pointer text-xs text-rose-600 dark:text-rose-400"
                          >
                            <span className="flex items-center gap-1.5">
                              <XCircle className="size-3" />
                              <span>Expired / Suspended</span>
                            </span>
                            <span className="ml-auto font-mono text-[10px] bg-muted text-muted-foreground px-1.5 py-0.2 rounded-full">
                              {(stats?.expiredSubscriptions ?? 0) + (stats?.inactiveSubscriptions ?? 0)}
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            size="sm"
                            isActive={currentView === 'subs_analytics'}
                            onClick={() => setView('subs_analytics')}
                            className="cursor-pointer text-xs"
                          >
                            <span className="flex items-center gap-1.5">
                              <TrendingUp className="size-3" />
                              <span>Tier Analytics</span>
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>

                {/* 3. Businesses */}
                <SidebarMenuItem>
                  <Collapsible open={isBizOpen} onOpenChange={setIsBizOpen}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={`rounded-xl my-0.5 cursor-pointer ${isBizCategory ? 'bg-blue-50/60 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : ''}`}
                        tooltip="Businesses"
                      >
                        <Building2Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-semibold text-xs flex-1 text-left">Businesses</span>
                        <ChevronDownIcon className={`size-3.5 transition-transform duration-200 ${isBizOpen ? 'rotate-180' : ''}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            size="sm"
                            isActive={currentView === 'biz_all'}
                            onClick={() => setView('biz_all')}
                            className="cursor-pointer text-xs"
                          >
                            <span>All Businesses</span>
                            <span className="ml-auto font-mono text-[10px] bg-muted text-muted-foreground px-1.5 py-0.2 rounded-full">
                              {businesses.length}
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            size="sm"
                            isActive={currentView === 'biz_active'}
                            onClick={() => setView('biz_active')}
                            className="cursor-pointer text-xs"
                          >
                            <span>Active Businesses</span>
                            <span className="ml-auto font-mono text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded-full">
                              {stats?.activeBusinesses ?? 0}
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            size="sm"
                            isActive={currentView === 'biz_disabled'}
                            onClick={() => setView('biz_disabled')}
                            className="cursor-pointer text-xs"
                          >
                            <span>Suspended Businesses</span>
                            <span className="ml-auto font-mono text-[10px] bg-muted text-muted-foreground px-1.5 py-0.2 rounded-full">
                              {(stats?.totalBusinesses ?? businesses.length) - (stats?.activeBusinesses ?? 0)}
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>

                {/* 4. Users */}
                <SidebarMenuItem>
                  <Collapsible open={isUsersOpen} onOpenChange={setIsUsersOpen}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={`rounded-xl my-0.5 cursor-pointer ${isUsersCategory ? 'bg-blue-50/60 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : ''}`}
                        tooltip="Users"
                      >
                        <UsersIcon className="size-4 text-purple-600 dark:text-purple-400" />
                        <span className="font-semibold text-xs flex-1 text-left">Users</span>
                        <ChevronDownIcon className={`size-3.5 transition-transform duration-200 ${isUsersOpen ? 'rotate-180' : ''}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            size="sm"
                            isActive={currentView === 'users_all'}
                            onClick={() => setView('users_all')}
                            className="cursor-pointer text-xs"
                          >
                            <span>All Users</span>
                            <span className="ml-auto font-mono text-[10px] bg-muted text-muted-foreground px-1.5 py-0.2 rounded-full">
                              {users.length}
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            size="sm"
                            isActive={currentView === 'users_admins'}
                            onClick={() => setView('users_admins')}
                            className="cursor-pointer text-xs"
                          >
                            <span>Administrators</span>
                            <span className="ml-auto font-mono text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 rounded-full">
                              {users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length}
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            size="sm"
                            isActive={currentView === 'users_members'}
                            onClick={() => setView('users_members')}
                            className="cursor-pointer text-xs"
                          >
                            <span>Standard Users</span>
                            <span className="ml-auto font-mono text-[10px] bg-muted text-muted-foreground px-1.5 py-0.2 rounded-full">
                              {users.filter(u => u.role === 'USER' || u.role === 'EMPLOYEE').length}
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>

                {/* 5. Modules */}
                <SidebarMenuItem>
                  <Collapsible open={isModulesOpen} onOpenChange={setIsModulesOpen}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={`rounded-xl my-0.5 cursor-pointer ${isModulesCategory ? 'bg-blue-50/60 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : ''}`}
                        tooltip="Modules"
                      >
                        <Layers className="size-4 text-amber-600 dark:text-amber-400" />
                        <span className="font-semibold text-xs flex-1 text-left">Modules</span>
                        <ChevronDownIcon className={`size-3.5 transition-transform duration-200 ${isModulesOpen ? 'rotate-180' : ''}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            size="sm"
                            isActive={currentView === 'modules_all'}
                            onClick={() => setView('modules_all')}
                            className="cursor-pointer text-xs"
                          >
                            <span>All Modules</span>
                            <span className="ml-auto font-mono text-[10px] bg-muted text-muted-foreground px-1.5 py-0.2 rounded-full">
                              {modules.length}
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>

            {/* Footer User Profile Card */}
            <SidebarFooter className="p-3 border-t border-border bg-card dark:bg-[#15171a]">
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    SA
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground truncate">Subscription Admin</span>
                    <span className="text-[10px] font-mono text-muted-foreground truncate">admin@admin.com</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="size-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                  title="Sign Out"
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          {/* ── WORKSPACE INSET (Matching DashboardGlobalHeader & Page Container) ── */}
          <SidebarInset className="min-h-svh bg-muted/30 flex flex-col min-w-0">
            {/* Top Bar Header (Identical to DashboardGlobalHeader) */}
            <div className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] sm:px-6 lg:px-8 dark:bg-[#121418]/80 dark:border-[#1e2228] dark:shadow-none w-full">
              <header className="flex items-center justify-between gap-4 w-full">
                {/* Left Side: Title & Badge */}
                <div className="flex min-w-0 items-center gap-3">
                  <SidebarTrigger className="-ml-1 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all dark:bg-[#181a20] dark:border-[#23272c] dark:hover:bg-[#1c2128] dark:hover:border-blue-900/50" />
                  <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-b from-blue-50 to-blue-100/50 text-blue-600 shadow-sm border border-blue-100/50 dark:from-blue-500/20 dark:to-blue-500/5 dark:text-blue-400 dark:border-blue-500/20">
                    <Building2Icon className="size-4" />
                  </div>
                  <div className="flex flex-col leading-tight ml-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold tracking-tight text-foreground dark:text-slate-100">
                        {viewHeadings[currentView].title}
                      </span>
                      <Badge variant="secondary" className="hidden sm:inline-flex bg-muted/80 text-muted-foreground dark:bg-[#1c2128] dark:text-slate-400 border-none px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider">
                        Super Admin
                      </Badge>
                    </div>
                    <span className="truncate text-xs font-medium text-muted-foreground dark:text-slate-400">
                      {viewHeadings[currentView].subtitle}
                    </span>
                  </div>
                </div>

                {/* Right Side: Global Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Subscription Engine Live</span>
                  </div>

                  <DashboardModeToggle className="size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all dark:bg-[#181a20] dark:border-[#23272c] dark:hover:bg-[#1c2128] dark:hover:border-blue-900/50" />

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fetchAllData(true)}
                    disabled={isRefreshing}
                    className="size-9 rounded-full cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all dark:bg-[#181a20] dark:border-[#23272c] dark:hover:bg-[#1c2128]"
                    title="Sync Data"
                  >
                    <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                  </Button>

                  {/* Context Action Buttons */}
                  {isSubsCategory && (
                    <Button
                      size="sm"
                      onClick={() => {
                        resetActionState();
                        setActivateModalOpen(true);
                      }}
                      className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 gap-1.5 shadow-sm"
                    >
                      <PlusCircle className="size-3.5" />
                      <span>Activate Plan</span>
                    </Button>
                  )}

                  {isUsersCategory && (
                    <Button
                      size="sm"
                      onClick={() => setCreateUserModalOpen(true)}
                      className="h-9 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3.5 gap-1.5 shadow-sm"
                    >
                      <UserPlus className="size-3.5" />
                      <span>New User</span>
                    </Button>
                  )}

                  {isModulesCategory && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setModuleFormName('');
                        setModuleFormActions(['read', 'create', 'update']);
                        setCreateModuleModalOpen(true);
                      }}
                      className="h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3.5 gap-1.5 shadow-sm"
                    >
                      <FolderPlus className="size-3.5" />
                      <span>New Module</span>
                    </Button>
                  )}

                  <div className="h-4 w-px bg-border hidden sm:block mx-0.5" />

                  {/* Admin User Menu Avatar Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative size-9 rounded-full p-0 cursor-pointer">
                        <Avatar className="size-9 border border-border">
                          <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">SA</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg" align="end">
                      <div className="flex flex-col space-y-1 p-2">
                        <p className="text-xs font-bold text-foreground">Subscription Admin</p>
                        <p className="text-[11px] font-mono text-muted-foreground truncate">admin@admin.com</p>
                        <Badge variant="outline" className="w-fit text-[10px] mt-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                          SUPER_ADMIN
                        </Badge>
                      </div>
                      <DropdownMenuSeparator className="my-1 border-border" />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg">
                        <LogOut className="size-3.5 mr-2" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>
            </div>

            {/* Body Content Container (Matching dashboard-page-client.tsx) */}
            <div className="flex min-h-[calc(100vh-65px)] flex-col gap-6 bg-background px-4 pb-10 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
              
              {/* ── VIEW 1: OVERVIEW ────────────────────────────────────────── */}
              {currentView === 'overview' && (
                <div className="space-y-6">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 dark:border-[#23272c] dark:bg-[#181a20]">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
                        <CardDescription className="text-[13px] font-medium text-muted-foreground">Total Tenants</CardDescription>
                        <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                          <Building2Icon className="size-4" />
                        </div>
                      </CardHeader>
                      <CardContent className="pb-6">
                        <CardTitle className="text-2xl font-bold tracking-tight text-foreground dark:text-slate-100">
                          {isLoading ? '...' : (stats?.totalBusinesses ?? businesses.length)}
                        </CardTitle>
                        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats?.activeBusinesses ?? 0} Active</span>
                          <span>•</span>
                          <span>{(stats?.totalBusinesses ?? 0) - (stats?.activeBusinesses ?? 0)} Disabled</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 dark:border-[#23272c] dark:bg-[#181a20]">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
                        <CardDescription className="text-[13px] font-medium text-muted-foreground">Active Subscriptions</CardDescription>
                        <div className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <ShieldCheck className="size-4" />
                        </div>
                      </CardHeader>
                      <CardContent className="pb-6">
                        <CardTitle className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                          {isLoading ? '...' : (stats?.activeSubscriptions ?? 0)}
                        </CardTitle>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          Total Registered: <span className="text-foreground font-semibold">{stats?.totalSubscriptions ?? subscriptions.length}</span>
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 dark:border-[#23272c] dark:bg-[#181a20]">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
                        <CardDescription className="text-[13px] font-medium text-muted-foreground">Expiring in 7 Days</CardDescription>
                        <div className={`flex size-9 items-center justify-center rounded-full ${(stats?.expiringSoon ?? 0) > 0 ? 'bg-amber-100 text-amber-700 animate-bounce dark:bg-amber-950/60 dark:text-amber-300' : 'bg-muted text-muted-foreground'}`}>
                          <Clock className="size-4" />
                        </div>
                      </CardHeader>
                      <CardContent className="pb-6">
                        <CardTitle className={`text-2xl font-bold tracking-tight ${(stats?.expiringSoon ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                          {isLoading ? '...' : (stats?.expiringSoon ?? 0)}
                        </CardTitle>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          {(stats?.expiringSoon ?? 0) > 0 ? 'Requires renewal attention' : 'All subscriptions healthy'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 dark:border-[#23272c] dark:bg-[#181a20]">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
                        <CardDescription className="text-[13px] font-medium text-muted-foreground">Platform Users</CardDescription>
                        <div className="flex size-9 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                          <UsersIcon className="size-4" />
                        </div>
                      </CardHeader>
                      <CardContent className="pb-6">
                        <CardTitle className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                          {isLoading ? '...' : users.length}
                        </CardTitle>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          Across <span className="text-foreground font-semibold">{businesses.length}</span> registered tenants
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Functionality Launchpad */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 flex flex-col justify-between dark:border-[#23272c] dark:bg-[#181a20]">
                      <div>
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-1.5">
                          <CreditCardIcon className="size-4" />
                          <span>Subscription Management</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Oversee tenant plans, activate terms, extend expirations, and enforce license gating.
                        </p>
                      </div>
                      <Button
                        onClick={() => setView('subs_all')}
                        variant="outline"
                        className="mt-4 w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-950/30 font-semibold text-xs h-9 rounded-xl"
                      >
                        <span>Manage Subscriptions ({subscriptions.length})</span>
                      </Button>
                    </Card>

                    <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 flex flex-col justify-between dark:border-[#23272c] dark:bg-[#181a20]">
                      <div>
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-1.5">
                          <Building2Icon className="size-4" />
                          <span>Tenants & Businesses</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Directory of all organizations, owners, member user counts, and active/disabled switches.
                        </p>
                      </div>
                      <Button
                        onClick={() => setView('biz_all')}
                        variant="outline"
                        className="mt-4 w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-950/30 font-semibold text-xs h-9 rounded-xl"
                      >
                        <span>View Businesses ({businesses.length})</span>
                      </Button>
                    </Card>

                    <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 flex flex-col justify-between dark:border-[#23272c] dark:bg-[#181a20]">
                      <div>
                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm mb-1.5">
                          <UsersIcon className="size-4" />
                          <span>Users & Modules</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Govern user accounts, platform roles, and core ERP functional modules and capabilities.
                        </p>
                      </div>
                      <Button
                        onClick={() => setView('users_all')}
                        variant="outline"
                        className="mt-4 w-full border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-950/30 font-semibold text-xs h-9 rounded-xl"
                      >
                        <span>View Platform Users ({users.length})</span>
                      </Button>
                    </Card>
                  </div>

                  {/* Tier adoption overview */}
                  <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 dark:border-[#23272c] dark:bg-[#181a20]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <TrendingUp className="size-4 text-blue-600" />
                        <span>Plan Tier Adoption</span>
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setView('subs_analytics')}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 h-8"
                      >
                        <span>Full Analytics →</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {stats?.planBreakdown && Object.entries(stats.planBreakdown).map(([plan, count]) => (
                        <div key={plan} className="p-4 rounded-xl bg-muted/40 border border-border">
                          <div className="flex items-center justify-between">
                            {getPlanBadge(plan)}
                            <span className="text-xs font-mono font-bold text-muted-foreground">{count} tenant(s)</span>
                          </div>
                          <div className="mt-3 text-2xl font-bold text-foreground">{count}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* ── VIEW 2: SUBSCRIPTIONS (All, Active, Expiring, Expired) ─── */}
              {isSubsCategory && currentView !== 'subs_analytics' && (
                <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden dark:border-[#23272c] dark:bg-[#181a20]">
                  <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search business, plan, or memo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-background text-xs h-10 border-border rounded-xl text-foreground"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {availablePlans.length > 0 && (
                        <select
                          value={subPlanFilter}
                          onChange={(e) => setSubPlanFilter(e.target.value)}
                          className="text-xs font-medium bg-background border border-border rounded-xl px-3 py-2 text-foreground outline-none cursor-pointer"
                        >
                          <option value="ALL">All Plans</option>
                          {availablePlans.map(plan => (
                            <option key={plan} value={plan}>{plan}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                          <th className="py-3 px-4">Tenant & Business</th>
                          <th className="py-3 px-4">Plan Tier</th>
                          <th className="py-3 px-4">License Status</th>
                          <th className="py-3 px-4">Term Validity</th>
                          <th className="py-3 px-4">Time Left</th>
                          <th className="py-3 px-4">Billing Memo</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {displayedSubscriptions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-muted-foreground">
                              No subscriptions match the selected criteria.
                            </td>
                          </tr>
                        ) : (
                          displayedSubscriptions.map((sub) => {
                            const isNearExpiry = sub.remainingDays !== null && sub.remainingDays <= 7 && sub.remainingDays >= 0;
                            return (
                              <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground text-xs">
                                      {sub.business?.name || 'Unnamed Business'}
                                    </span>
                                    {sub.business?.countryCode && (
                                      <Badge variant="outline" className="text-[10px] py-0 px-1 bg-muted">
                                        {sub.business.countryCode}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                      ID: {sub.businessId.slice(0, 14)}...
                                    </span>
                                    <button
                                      onClick={() => handleCopy(sub.businessId, `sub-${sub.id}`)}
                                      className="text-muted-foreground hover:text-foreground p-0.5"
                                      title="Copy Business ID"
                                    >
                                      {copiedId === `sub-${sub.id}` ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                                    </button>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4">
                                  {getPlanBadge(sub.planName)}
                                </td>

                                <td className="py-3.5 px-4">
                                  {getStatusBadge(sub.status, sub.remainingDays, sub.expiresAt)}
                                </td>

                                <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                                  {sub.startDate && sub.expiresAt ? (
                                    <>
                                      <div className="font-semibold text-foreground">{formatDate(sub.startDate)}</div>
                                      <div className="text-[10px] text-muted-foreground/80">to {formatDate(sub.expiresAt)}</div>
                                    </>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                      <Clock className="size-3 text-slate-400" />
                                      Pending Activation
                                    </span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 font-mono font-medium">
                                  {sub.remainingDays === null || !sub.expiresAt ? (
                                    <span className="text-muted-foreground text-[11px] italic">Not started</span>
                                  ) : sub.remainingDays > 0 ? (
                                    <span className={isNearExpiry ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-foreground'}>
                                      {sub.remainingDays} days
                                    </span>
                                  ) : (
                                    <span className="text-rose-600 dark:text-rose-400 font-bold">Lapsed</span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 max-w-[200px] truncate text-muted-foreground">
                                  {sub.notes || '—'}
                                </td>

                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {sub.status === 'ACTIVE' && sub.expiresAt ? (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedBusiness({
                                              id: sub.businessId,
                                              name: sub.business?.name || 'Business',
                                              currentPlan: sub.planName,
                                              expiresAt: sub.expiresAt,
                                            });
                                            setSelectedDuration(6);
                                            setExtendDays(30);
                                            setExtendUnit('days');
                                            setExtendModalOpen(true);
                                          }}
                                          className="h-7 px-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer"
                                        >
                                          Extend
                                        </Button>

                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const isPreset = ['Starter', 'Professional', 'Enterprise', 'Growth'].includes(sub.planName || '');
                                            setSelectedBusiness({
                                              id: sub.businessId,
                                              name: sub.business?.name || 'Business',
                                              currentPlan: sub.planName,
                                              expiresAt: sub.expiresAt,
                                              notes: sub.notes,
                                            });
                                            setEditPlanTier(isPreset ? (sub.planName || 'Professional') : 'Custom');
                                            setEditCustomPlan(isPreset ? '' : (sub.planName || ''));
                                            setEditNotes(sub.notes || '');
                                            setEditKeepExpiry(true);
                                            setEditExpiryDate(sub.expiresAt ? new Date(sub.expiresAt).toISOString().split('T')[0] : '');
                                            setEditPlanModalOpen(true);
                                          }}
                                          className="h-7 px-2.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg cursor-pointer flex items-center gap-1"
                                        >
                                          <SlidersHorizontal className="size-3" />
                                          <span>Edit Plan</span>
                                        </Button>

                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setSelectedBusiness({
                                              id: sub.businessId,
                                              name: sub.business?.name || 'Business',
                                            });
                                            setDeactivateModalOpen(true);
                                          }}
                                          className="h-7 px-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                                        >
                                          Suspend
                                        </Button>
                                      </>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const isPreset = ['Starter', 'Professional', 'Enterprise', 'Growth'].includes(sub.planName || '');
                                            setSelectedBusiness({
                                              id: sub.businessId,
                                              name: sub.business?.name || 'Business',
                                              currentPlan: sub.planName,
                                              expiresAt: sub.expiresAt,
                                              notes: sub.notes,
                                            });
                                            setEditPlanTier(isPreset ? (sub.planName || 'Professional') : 'Custom');
                                            setEditCustomPlan(isPreset ? '' : (sub.planName || ''));
                                            setEditNotes(sub.notes || '');
                                            setEditKeepExpiry(true);
                                            setEditExpiryDate(sub.expiresAt ? new Date(sub.expiresAt).toISOString().split('T')[0] : '');
                                            setEditPlanModalOpen(true);
                                          }}
                                          className="h-7 px-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg cursor-pointer"
                                        >
                                          Edit Plan
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setSelectedBusiness({
                                              id: sub.businessId,
                                              name: sub.business?.name || 'Business',
                                              currentPlan: sub.planName,
                                            });
                                            setSelectedPlan(sub.planName || 'Professional');
                                            setSelectedDuration(12);
                                            setSelectedDays(30);
                                            setDurationUnit('days');
                                            setActivateModalOpen(true);
                                          }}
                                          className="h-7 px-3 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                                        >
                                          <CheckCircle2 className="size-3.5" />
                                          <span>Activate</span>
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* ── VIEW 3: TIER ANALYTICS ──────────────────────────────────── */}
              {currentView === 'subs_analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="rounded-2xl border-border bg-card p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-[#23272c] dark:bg-[#181a20]">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active License Ratio</span>
                      <div className="mt-3 text-3xl font-extrabold text-foreground">
                        {stats?.totalSubscriptions ? Math.round(((stats.activeSubscriptions || 0) / stats.totalSubscriptions) * 100) : 0}%
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{
                            width: `${stats?.totalSubscriptions ? Math.min(100, Math.round(((stats.activeSubscriptions || 0) / stats.totalSubscriptions) * 100)) : 0}%`
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-2 block">
                        {stats?.activeSubscriptions ?? 0} active of {stats?.totalSubscriptions ?? 0} registered
                      </span>
                    </Card>

                    <Card className="rounded-2xl border-border bg-card p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-[#23272c] dark:bg-[#181a20]">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expiring Exposure</span>
                      <div className={`mt-3 text-3xl font-extrabold ${(stats?.expiringSoon ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                        {stats?.expiringSoon ?? 0}
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-2 block">
                        Licenses requiring immediate renewal outreach
                      </span>
                    </Card>

                    <Card className="rounded-2xl border-border bg-card p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-[#23272c] dark:bg-[#181a20]">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Suspended / Inactive</span>
                      <div className="mt-3 text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                        {(stats?.expiredSubscriptions ?? 0) + (stats?.inactiveSubscriptions ?? 0)}
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-2 block">
                        Tenants with gated financial & module access
                      </span>
                    </Card>
                  </div>

                  <Card className="rounded-2xl border-border bg-card p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-[#23272c] dark:bg-[#181a20]">
                    <h3 className="text-sm font-bold text-foreground mb-4">Detailed Plan Breakdown</h3>
                    <div className="space-y-3">
                      {stats?.planBreakdown && Object.entries(stats.planBreakdown).map(([plan, count]) => {
                        const total = stats.totalSubscriptions || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={plan} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-foreground">{plan}</span>
                              <span className="font-mono text-muted-foreground">{count} tenants ({pct}%)</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              )}

              {/* ── VIEW 4: BUSINESSES (All, Active, Disabled) ─────────────── */}
              {isBizCategory && (
                <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden dark:border-[#23272c] dark:bg-[#181a20]">
                  <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search by name, legal name, owner, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-background text-xs h-10 border-border rounded-xl text-foreground"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Showing <span className="font-bold text-foreground">{displayedBusinesses.length}</span> of {businesses.length} businesses
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                          <th className="py-3 px-4">Business Details</th>
                          <th className="py-3 px-4">Owner Contact</th>
                          <th className="py-3 px-4">Platform Status</th>
                          <th className="py-3 px-4">Subscription Plan</th>
                          <th className="py-3 px-4">Allocated Modules</th>
                          <th className="py-3 px-4">Users</th>
                          <th className="py-3 px-4">Created Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {displayedBusinesses.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-12 text-muted-foreground">
                              No businesses match your search filter.
                            </td>
                          </tr>
                        ) : (
                          displayedBusinesses.map((b) => (
                            <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-foreground text-xs">{b.name}</span>
                                  {b.countryCode && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1 bg-muted">
                                      {b.countryCode}
                                    </Badge>
                                  )}
                                </div>
                                {b.legalName && (
                                  <div className="text-[11px] text-muted-foreground">{b.legalName}</div>
                                )}
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-mono text-muted-foreground">ID: {b.id.slice(0, 14)}...</span>
                                  <button
                                    onClick={() => handleCopy(b.id, `biz-${b.id}`)}
                                    className="text-muted-foreground hover:text-foreground p-0.5"
                                  >
                                    {copiedId === `biz-${b.id}` ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                                  </button>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-medium text-foreground">{b.owner?.name || 'No Owner'}</div>
                                <div className="text-[11px] text-muted-foreground font-mono">{b.owner?.email || '—'}</div>
                              </td>

                              <td className="py-3.5 px-4">
                                {b.isActive ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                                    <span className="size-1.5 rounded-full bg-rose-500" />
                                    Disabled
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                {b.subscription ? (
                                  <div>
                                    {getPlanBadge(b.subscription.planName)}
                                    <div className="text-[10px] text-muted-foreground mt-1">
                                      {b.subscription.status} • {b.subscription.remainingDays !== null ? `${b.subscription.remainingDays}d left` : 'Indefinite'}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">No License</span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                {b.allocatedModules && b.allocatedModules.length > 0 ? (
                                  <div className="flex flex-col gap-1 items-start">
                                    <Badge variant="outline" className="text-[10px] py-0.5 px-2 font-semibold bg-purple-50/80 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                                      {b.allocatedModules.length === ALLOCATABLE_MODULES.length ? 'All 9 Modules' : `${b.allocatedModules.length} Modules`}
                                    </Badge>
                                    <div className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={b.allocatedModules.map(m => ALLOCATABLE_MODULES.find(am => am.id === m)?.name || m).join(', ')}>
                                      {b.allocatedModules.map(m => ALLOCATABLE_MODULES.find(am => am.id === m)?.name || m).join(', ')}
                                    </div>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] py-0.5 px-2 text-slate-500 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
                                    All (Default)
                                  </Badge>
                                )}
                              </td>

                              <td className="py-3.5 px-4 font-mono font-medium">
                                {b._count?.users ?? 0}
                              </td>

                              <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                                {formatDate(b.createdAt)}
                              </td>

                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleBusiness(b)}
                                    className={`h-7 px-2.5 text-[11px] font-semibold rounded-lg ${
                                      b.isActive ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                                    }`}
                                  >
                                    {b.isActive ? 'Disable' : 'Enable'}
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedBusiness({
                                        id: b.id,
                                        name: b.name,
                                        currentPlan: b.subscription?.planName || undefined,
                                        expiresAt: b.subscription?.expiresAt || undefined,
                                      });
                                      setSelectedDuration(12);
                                      setActivateModalOpen(true);
                                    }}
                                    className="h-7 px-2.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                                  >
                                    License
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openAllocateModal(b)}
                                    className="h-7 px-2.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg flex items-center gap-1"
                                  >
                                    <Layers className="size-3" />
                                    Modules
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* ── VIEW 5: USERS (All, Admins, Members) ────────────────────── */}
              {isUsersCategory && (
                <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden dark:border-[#23272c] dark:bg-[#181a20]">
                  <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-background text-xs h-10 border-border rounded-xl text-foreground"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Showing <span className="font-bold text-foreground">{displayedUsers.length}</span> users
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Platform Role</th>
                          <th className="py-3 px-4">Account Status</th>
                          <th className="py-3 px-4">Associated Tenants</th>
                          <th className="py-3 px-4">Created Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {displayedUsers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-muted-foreground">
                              No platform users match your search.
                            </td>
                          </tr>
                        ) : (
                          displayedUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-foreground">
                                <div className="flex items-center gap-2">
                                  <div className="size-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold text-[11px]">
                                    {u.name?.slice(0, 2).toUpperCase() || 'U'}
                                  </div>
                                  <span>{u.name || 'Unnamed User'}</span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-mono text-muted-foreground">
                                {u.email}
                              </td>

                              <td className="py-3.5 px-4">
                                <Badge
                                  variant="secondary"
                                  className={`text-[11px] font-semibold ${
                                    u.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300' :
                                    u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300' :
                                    'bg-muted text-foreground'
                                  }`}
                                >
                                  {u.role}
                                </Badge>
                              </td>

                              <td className="py-3.5 px-4">
                                {u.isActive ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                                    <span className="size-1.5 rounded-full bg-rose-500" />
                                    Disabled
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 max-w-[200px] truncate text-muted-foreground">
                                {(u.memberships && u.memberships.length > 0) ? (
                                  u.memberships.map(m => m.business?.name).filter(Boolean).join(', ')
                                ) : (u.businessesOwned && u.businessesOwned.length > 0) ? (
                                  u.businessesOwned.map(b => b.name).join(', ')
                                ) : (
                                  'None'
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                                {formatDate(u.createdAt)}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`h-7 px-2.5 text-[11px] font-semibold rounded-lg ${
                                    u.isActive ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                                  }`}
                                >
                                  {u.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* ── VIEW 6: MODULES MANAGEMENT ──────────────────────────────── */}
              {isModulesCategory && (
                <div className="space-y-4">
                  <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden dark:border-[#23272c] dark:bg-[#181a20]">
                    <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="relative flex-1 max-w-md">
                        <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search modules..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 bg-background text-xs h-10 border-border rounded-xl text-foreground"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground font-semibold">
                        {displayedModules.length} Modules in Registry
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                      {displayedModules.map((mod) => (
                        <div key={mod.id} className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm text-foreground flex items-center gap-2">
                                <Layers className="size-4 text-amber-600" />
                                <span>{mod.name}</span>
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setActiveModuleForDelete(mod);
                                  setDeleteModuleModalOpen(true);
                                }}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-600"
                                title="Delete Module"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {mod.actions?.map((act) => (
                                <Badge key={act} variant="outline" className="text-[10px] font-mono font-semibold bg-muted text-foreground">
                                  {act}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

            </div>
          </SidebarInset>
        </div>

        {/* ── MODALS FOR SUBSCRIPTION ADMIN FUNCTIONALITY ─────────────── */}

        {/* MODAL 1: ACTIVATE SUBSCRIPTION */}
        <Dialog open={activateModalOpen} onOpenChange={setActivateModalOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border text-foreground dark:bg-[#181920] dark:border-[#24272c] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-600" />
                <span>Activate Business Subscription</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Grant an active license and automatically activate tenant business operations.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Target Business Select (Contains ALL businesses) */}
              <div>
                <label className="font-semibold text-foreground block mb-1.5 text-xs">Target Business</label>
                <select
                  value={selectedBusiness?.id || ''}
                  onChange={(e) => {
                    const b = businesses.find(item => item.id === e.target.value);
                    if (b) setSelectedBusiness({ id: b.id, name: b.name, currentPlan: b.subscription?.planName || undefined });
                    else setSelectedBusiness(null);
                  }}
                  className="w-full text-xs bg-background text-foreground border border-input rounded-xl p-2.5 font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Select a business...</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}{b.countryCode ? ` (${b.countryCode})` : ''}
                    </option>
                  ))}
                </select>
                {selectedBusiness && (
                  <div className="mt-1 text-[11px] font-mono text-muted-foreground truncate">
                    Selected ID: {selectedBusiness.id}
                  </div>
                )}
              </div>

              {/* Plan Tier Selection */}
              <div>
                <label className="font-semibold text-foreground block mb-1.5 text-xs">Plan Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Starter', 'Professional', 'Enterprise', 'Growth', 'Custom'].map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        selectedPlan === plan 
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-300 font-bold' 
                          : 'border-border bg-card text-foreground hover:bg-muted'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
                {selectedPlan === 'Custom' && (
                  <Input
                    type="text"
                    placeholder="Enter custom plan name..."
                    value={customPlan}
                    onChange={(e) => setCustomPlan(e.target.value)}
                    className="mt-2 text-xs rounded-xl bg-background border-input text-foreground"
                  />
                )}
              </div>

              {/* Duration & Validity Mode: Days vs Months */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground text-xs">
                    Term Validity Duration
                  </label>
                  {/* Unit toggle */}
                  <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                    <button
                      type="button"
                      onClick={() => setDurationUnit('days')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                        durationUnit === 'days'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setDurationUnit('months')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                        durationUnit === 'months'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Months
                    </button>
                  </div>
                </div>

                {durationUnit === 'days' ? (
                  <div>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        max={3650}
                        value={selectedDays}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setSelectedDays(isNaN(val) || val < 1 ? 1 : val);
                        }}
                        className="text-xs h-10 font-bold pr-16 rounded-xl bg-background border-input text-foreground"
                        placeholder="Enter number of days (e.g. 30)"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                        day{selectedDays > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[7, 14, 30, 60, 90, 180, 365].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setSelectedDays(days)}
                          className={`py-1 px-2.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                            selectedDays === days
                              ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-300 font-bold'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {days} days
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        value={selectedDuration}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setSelectedDuration(isNaN(val) || val < 1 ? 1 : val);
                        }}
                        className="text-xs h-10 font-bold pr-16 rounded-xl bg-background border-input text-foreground"
                        placeholder="Enter months (e.g. 12)"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                        month{selectedDuration > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[1, 3, 6, 12, 24, 36].map((months) => (
                        <button
                          key={months}
                          type="button"
                          onClick={() => setSelectedDuration(months)}
                          className={`py-1 px-2.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                            selectedDuration === months
                              ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-300 font-bold'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {months} mo{months > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Term Validity Preview */}
                <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Clock className="size-3.5 text-emerald-600" />
                      Day count starts upon activation:
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold border-emerald-300">
                      {activationValidityPreview.daysTotal} Days Total
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs font-semibold">
                    <span>Starts Today ({activationValidityPreview.startFormatted})</span>
                    <span className="text-muted-foreground">→</span>
                    <span>Valid until ({activationValidityPreview.endFormatted})</span>
                  </div>
                </div>
              </div>

              {/* Billing Memo */}
              <div>
                <label className="font-semibold text-foreground block mb-1 text-xs">Billing Memo / Notes</label>
                <Input
                  type="text"
                  placeholder="e.g. Wire transfer confirmed / Contract signed"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="text-xs rounded-xl bg-background border-input text-foreground"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setActivateModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleActivateSubmit}
                disabled={isSubmitting || !selectedBusiness}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
              >
                {isSubmitting ? 'Activating...' : `Activate Subscription (${durationUnit === 'days' ? `${selectedDays} Days` : `${selectedDuration} Mos`})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 2: EXTEND SUBSCRIPTION */}
        <Dialog open={extendModalOpen} onOpenChange={setExtendModalOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border text-foreground dark:bg-[#181920] dark:border-[#24272c] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="size-5 text-blue-600" />
                <span>Extend License Duration</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add additional days or months to existing tenant subscription seamlessly.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {selectedBusiness && (
                <div className="p-3 rounded-xl border border-border bg-muted/40">
                  <span className="font-bold text-foreground block">{selectedBusiness.name}</span>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                    <span>Current Plan: <span className="font-semibold text-foreground">{selectedBusiness.currentPlan || 'Default'}</span></span>
                    <span>Expires: <span className="font-semibold text-foreground">{extendValidityPreview.currentExpiryFormatted}</span></span>
                  </div>
                </div>
              )}

              {/* Additional Duration Mode: Days vs Months */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground text-xs">
                    Additional Extension Duration
                  </label>
                  {/* Unit toggle */}
                  <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                    <button
                      type="button"
                      onClick={() => setExtendUnit('days')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                        extendUnit === 'days'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtendUnit('months')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                        extendUnit === 'months'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Months
                    </button>
                  </div>
                </div>

                {extendUnit === 'days' ? (
                  <div>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        max={3650}
                        value={extendDays}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setExtendDays(isNaN(val) || val < 1 ? 1 : val);
                        }}
                        className="text-xs h-10 font-bold pr-16 rounded-xl bg-background border-input text-foreground"
                        placeholder="Enter days to add (e.g. 30)"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                        day{extendDays > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[7, 14, 30, 60, 90, 180, 365].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setExtendDays(days)}
                          className={`py-1 px-2.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                            extendDays === days
                              ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-300 font-bold'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          +{days} days
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        value={selectedDuration}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setSelectedDuration(isNaN(val) || val < 1 ? 1 : val);
                        }}
                        className="text-xs h-10 font-bold pr-16 rounded-xl bg-background border-input text-foreground"
                        placeholder="Enter months (e.g. 6)"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                        month{selectedDuration > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[1, 3, 6, 12, 24, 36].map((months) => (
                        <button
                          key={months}
                          type="button"
                          onClick={() => setSelectedDuration(months)}
                          className={`py-1 px-2.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                            selectedDuration === months
                              ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-300 font-bold'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          +{months} mo{months > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Extension Preview */}
                <div className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200">
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Clock className="size-3.5 text-blue-600" />
                      Extension Validity Preview:
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-bold border-blue-300">
                      +{extendValidityPreview.addedText}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs font-semibold">
                    <span>Base: {extendValidityPreview.currentExpiryFormatted}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">New Expiry: {extendValidityPreview.newExpiryFormatted}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1 text-xs">Extension Memo</label>
                <Input
                  type="text"
                  placeholder="e.g. Annual renewal received"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="text-xs rounded-xl bg-background border-input text-foreground"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setExtendModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleExtendSubmit}
                disabled={isSubmitting || !selectedBusiness}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
              >
                {isSubmitting ? 'Extending...' : `Extend (+${extendUnit === 'days' ? `${extendDays} Days` : `${selectedDuration} Mos`})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 3: DEACTIVATE SUBSCRIPTION */}
        <Dialog open={deactivateModalOpen} onOpenChange={setDeactivateModalOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border text-foreground dark:bg-[#181920] dark:border-[#24272c] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
                <ShieldAlert className="size-5 text-rose-600" />
                <span>Suspend License</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Suspending will gate invoice generation, payroll, and financials for this tenant.
              </DialogDescription>
            </DialogHeader>

            {selectedBusiness && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300">
                <span className="font-bold text-rose-900 dark:text-rose-200 block mb-1">{selectedBusiness.name}</span>
                <p>Are you sure you want to suspend this tenant's license?</p>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setDeactivateModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeactivateSubmit}
                disabled={isSubmitting || !selectedBusiness}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
              >
                {isSubmitting ? 'Suspending...' : 'Confirm Suspension'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 4: EDIT SUBSCRIPTION PLAN */}
        <Dialog open={editPlanModalOpen} onOpenChange={setEditPlanModalOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border text-foreground dark:bg-[#181920] dark:border-[#24272c] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Crown className="size-5 text-indigo-600 dark:text-indigo-400" />
                <span>Edit Subscription Plan</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update plan tier, customize features, and manage term validity for this tenant.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {selectedBusiness && (
                <div className="p-3 rounded-xl border border-border bg-muted/40 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-foreground block text-sm">{selectedBusiness.name}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">ID: {selectedBusiness.id.slice(0, 16)}...</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Current Plan</span>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800">
                      {selectedBusiness.currentPlan || 'Standard'}
                    </span>
                  </div>
                </div>
              )}

              {/* Select Plan Tier */}
              <div>
                <label className="font-semibold text-foreground block mb-1.5 text-xs">New Plan Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Starter', 'Professional', 'Enterprise', 'Growth', 'Custom'].map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setEditPlanTier(plan)}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        editPlanTier === plan
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-500 dark:text-indigo-300 font-bold shadow-sm'
                          : 'border-border bg-card text-foreground hover:bg-muted'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
                {editPlanTier === 'Custom' && (
                  <Input
                    type="text"
                    placeholder="Enter custom plan name (e.g. Premium Plus)..."
                    value={editCustomPlan}
                    onChange={(e) => setEditCustomPlan(e.target.value)}
                    className="mt-2 text-xs rounded-xl bg-background border-input text-foreground"
                  />
                )}
              </div>

              {/* Term Validity Options */}
              <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <Clock className="size-3.5 text-muted-foreground" />
                    Term Validity Option
                  </span>
                  {selectedBusiness?.expiresAt && (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Current: {formatDate(selectedBusiness.expiresAt)}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="validityOption"
                      checked={editKeepExpiry}
                      onChange={() => setEditKeepExpiry(true)}
                      className="text-indigo-600 cursor-pointer"
                    />
                    <span className="font-medium text-foreground">Keep Current Expiry</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="validityOption"
                      checked={!editKeepExpiry}
                      onChange={() => setEditKeepExpiry(false)}
                      className="text-indigo-600 cursor-pointer"
                    />
                    <span className="font-medium text-foreground">Change Expiry Date</span>
                  </label>
                </div>

                {!editKeepExpiry && (
                  <div className="pt-2">
                    <label className="font-medium text-muted-foreground block mb-1 text-[11px]">
                      Specify New Expiration Date
                    </label>
                    <Input
                      type="date"
                      value={editExpiryDate}
                      onChange={(e) => setEditExpiryDate(e.target.value)}
                      className="text-xs h-9 rounded-xl bg-background border-input text-foreground font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Billing Memo */}
              <div>
                <label className="font-semibold text-foreground block mb-1 text-xs">Billing Memo / Plan Change Notes</label>
                <Input
                  type="text"
                  placeholder="e.g. Plan upgraded per customer request"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="text-xs rounded-xl bg-background border-input text-foreground"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setEditPlanModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleEditPlanSubmit}
                disabled={isSubmitting || !selectedBusiness}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
              >
                {isSubmitting ? 'Saving...' : 'Save Plan Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL: ALLOCATE ERP MODULES */}
        <Dialog open={allocateModalOpen} onOpenChange={setAllocateModalOpen}>
          <DialogContent 
            data-lenis-prevent="true"
            className="sm:max-w-xl max-h-[85vh] flex flex-col bg-card border-border text-foreground dark:bg-[#181920] dark:border-[#24272c] rounded-2xl p-0 overflow-hidden shadow-2xl overscroll-contain"
          >
            <DialogHeader className="p-5 pb-3 border-b border-border/80 shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    <Layers className="size-4" />
                  </div>
                  <span>Allocate ERP Modules</span>
                </DialogTitle>
                {targetBusinessForModules?.countryCode && (
                  <Badge variant="outline" className="text-[10px] py-0.5 px-2 bg-muted font-bold">
                    {targetBusinessForModules.countryCode}
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Configure functional ERP modules enabled for <strong className="text-foreground">{targetBusinessForModules?.name}</strong>. The business will only display allocated modules in their navigation sidebar.
              </DialogDescription>
            </DialogHeader>

            {/* Quick Actions Bar */}
            <div className="px-5 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2 font-medium text-muted-foreground">
                <span>Selected:</span>
                <Badge variant="secondary" className="font-bold text-xs bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  {selectedAllocatedModules.length} of {ALLOCATABLE_MODULES.length} modules
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedAllocatedModules(ALLOCATABLE_MODULES.map(m => m.id))}
                  className="h-6 px-2 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                >
                  Select All
                </Button>
                <span className="text-muted-foreground">|</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedAllocatedModules([])}
                  className="h-6 px-2 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                >
                  Clear All
                </Button>
              </div>
            </div>

            {/* Modules Checkbox Grid */}
            <div 
              data-lenis-prevent="true"
              className="p-5 overflow-y-auto space-y-2.5 flex-1 min-h-0 max-h-[58vh] overscroll-contain pr-4 mr-0.5 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.3)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
            >
              {ALLOCATABLE_MODULES.map((module) => {
                const isSelected = selectedAllocatedModules.includes(module.id);
                return (
                  <div
                    key={module.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedAllocatedModules(prev => prev.filter(id => id !== module.id));
                      } else {
                        setSelectedAllocatedModules(prev => [...prev, module.id]);
                      }
                    }}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-purple-500/60 bg-purple-50/40 dark:bg-purple-950/20 shadow-sm'
                        : 'border-border/70 hover:border-border hover:bg-muted/30 opacity-75'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 size-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{module.name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${module.badgeClass}`}>
                          {module.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {module.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="p-4 border-t border-border bg-muted/20 gap-2 sm:gap-0 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAllocateModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAllocatedModules}
                disabled={isSavingModules || selectedAllocatedModules.length === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                {isSavingModules ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Saving Allocation...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" />
                    <span>Save Module Allocation ({selectedAllocatedModules.length})</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 4: CREATE USER */}
        <Dialog open={createUserModalOpen} onOpenChange={setCreateUserModalOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border text-foreground dark:bg-[#181920] dark:border-[#24272c] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <UserPlus className="size-5 text-purple-600" />
                <span>Provision Platform User</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Create a new user account across the SaaS platform.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Full Name</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="text-xs rounded-xl bg-background border-input text-foreground"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Email Address</label>
                <Input
                  type="email"
                  placeholder="user@company.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="text-xs rounded-xl bg-background border-input text-foreground"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Temporary Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="text-xs rounded-xl bg-background border-input text-foreground"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Global Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full text-xs bg-background text-foreground border border-input rounded-xl p-2.5 font-medium outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                >
                  <option value="USER">USER (Standard Member)</option>
                  <option value="ADMIN">ADMIN (Tenant Administrator)</option>
                  <option value="EMPLOYEE">EMPLOYEE (Workforce Member)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Platform Administrator)</option>
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setCreateUserModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateUserSubmit}
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
              >
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 5: CREATE MODULE */}
        <Dialog open={createModuleModalOpen} onOpenChange={setCreateModuleModalOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border text-foreground dark:bg-[#181920] dark:border-[#24272c] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <FolderPlus className="size-5 text-amber-600" />
                <span>Define New ERP Module</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Register a module and its allowed CRUD actions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Module Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Logistics, HelpDesk, Compliance"
                  value={moduleFormName}
                  onChange={(e) => setModuleFormName(e.target.value)}
                  className="text-xs rounded-xl bg-background border-input text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Allowed Action Verbs</label>
                <div className="flex flex-wrap gap-2">
                  {['read', 'create', 'update', 'delete', 'export', 'approve'].map((act) => {
                    const selected = moduleFormActions.includes(act);
                    return (
                      <button
                        key={act}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setModuleFormActions(moduleFormActions.filter(a => a !== act));
                          } else {
                            setModuleFormActions([...moduleFormActions, act]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                          selected 
                            ? 'border-amber-600 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:border-amber-500 dark:text-amber-300' 
                            : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {act} {selected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setCreateModuleModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateModuleSubmit}
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
              >
                {isSubmitting ? 'Registering...' : 'Register Module'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 6: DELETE MODULE */}
        <Dialog open={deleteModuleModalOpen} onOpenChange={setDeleteModuleModalOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border text-foreground dark:bg-[#181920] dark:border-[#24272c] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
                <Trash2 className="size-5 text-rose-600" />
                <span>Delete System Module</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Deleting a module permanently removes it from the platform registry.
              </DialogDescription>
            </DialogHeader>

            {activeModuleForDelete && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300">
                <span className="font-bold text-rose-900 dark:text-rose-200 block mb-1">{activeModuleForDelete.name}</span>
                <p>Are you sure you want to delete this module and its action registry?</p>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setDeleteModuleModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteModuleSubmit}
                disabled={isSubmitting || !activeModuleForDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </SidebarProvider>
    </DashboardThemeProvider>
  );
}
