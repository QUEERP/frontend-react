import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserIcon,
  MailIcon,
  CalendarIcon,
  Building2Icon,
  SaveIcon,
  EyeIcon,
  PlusIcon,
  Edit3Icon,
  TrashIcon,
  Loader2Icon,
  ShieldIcon,
  CheckCircle2Icon,
} from 'lucide-react'

import { NotificationBell } from './notification-bell'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { UserMenu } from './user-menu'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

type CrudPermissions = {
  read: boolean
  create: boolean
  update: boolean
  delete: boolean
}

type UserItem = {
  membershipId: string
  userId: string
  name: string
  email: string
  role: string
  status: 'Active' | 'Disabled'
  createdDate: string
  directPermissions: Array<{ module: string; action: string }>
}

const PERMISSION_TREE = [
  {
    name: 'Sales',
    sections: [
      {
        name: 'CRM & Customers',
        modules: [
          { name: 'Leads', key: 'lead' },
          { name: 'Deals', key: 'deal' },
          { name: 'Customers', key: 'customer' },
          { name: 'Contacts', key: 'contact' }
        ]
      },
      {
        name: 'Sales Operations',
        modules: [
          { name: 'Quotations', key: 'quotation' },
          { name: 'Sales Orders', key: 'sales_order' },
          { name: 'Invoices', key: 'invoice' },
          { name: 'Payments', key: 'payment' },
          { name: 'Credit Notes', key: 'credit_note' },
          { name: 'Returns', key: 'invoice' }, // Sales Returns share invoice permissions
          { name: 'Recurring Invoices', key: 'invoice' }
        ]
      },
      {
        name: 'Activities',
        modules: [
          { name: 'Meetings', key: 'meeting' },
          { name: 'Calls', key: 'call' },
          { name: 'Tasks', key: 'task' },
          { name: 'Notes', key: 'note' },
          { name: 'Activities', key: 'activities' }
        ]
      },
      {
        name: 'Marketing',
        modules: [
          { name: 'Campaigns', key: 'campaign' },
          { name: 'Email Tracking', key: 'email_log' }
        ]
      },
      {
        name: 'Analytics',
        modules: [
          { name: 'Sales Analytics', key: 'report' }
        ]
      }
    ]
  },
  {
    name: 'Procurement',
    sections: [
      {
        name: 'Vendors',
        modules: [
          { name: 'Vendors', key: 'vendor' }
        ]
      },
      {
        name: 'Purchasing',
        modules: [
          { name: 'Purchase Requests', key: 'purchase_request' },
          { name: 'Purchase Orders', key: 'purchase_order' },
          { name: 'Receipts', key: 'grn' },
          { name: 'Bills', key: 'bill' },
          { name: 'Vendor Payments', key: 'payment' },
          { name: 'Returns', key: 'purchase_returns' }
        ]
      },
      {
        name: 'Analytics',
        modules: [
          { name: 'Procurement Analytics', key: 'report' }
        ]
      }
    ]
  },
  {
    name: 'Inventory',
    sections: [
      {
        name: 'Product Management',
        modules: [
          { name: 'Products', key: 'product' },
          { name: 'Categories', key: 'product' },
          { name: 'Brands', key: 'product' },
          { name: 'Units', key: 'product' }
        ]
      },
      {
        name: 'Warehouse Operations',
        modules: [
          { name: 'Warehouses', key: 'warehouse' },
          { name: 'Stock Overview', key: 'stock' },
          { name: 'Transfers', key: 'stock' },
          { name: 'Adjustments', key: 'stock' }
        ]
      },
      {
        name: 'Monitoring',
        modules: [
          { name: 'Movement History', key: 'stock' },
          { name: 'Reorder Alerts', key: 'stock' }
        ]
      },
      {
        name: 'Analytics',
        modules: [
          { name: 'Inventory Analytics', key: 'report' }
        ]
      }
    ]
  },
  {
    name: 'Accounting & Finance',
    sections: [
      {
        name: 'Accounting',
        modules: [
          { name: 'Accounts', key: 'account' },
          { name: 'Journal Entries', key: 'journal' },
          { name: 'Expenses', key: 'expenses' },
          { name: 'Reports', key: 'report' }
        ]
      }
    ]
  },
  {
    name: 'Project Operations',
    sections: [
      {
        name: 'Dashboard',
        modules: [
          { name: 'Project Dashboard', key: 'project' }
        ]
      },
      {
        name: 'Pre-Sales',
        modules: [
          { name: 'Customer Inquiries', key: 'lead' },
          { name: 'Requirements', key: 'project' },
          { name: 'Estimations', key: 'project' },
          { name: 'Proposals', key: 'project' },
          { name: 'Negotiations', key: 'project' }
        ]
      },
      {
        name: 'Management',
        modules: [
          { name: 'Projects', key: 'project' },
          { name: 'Planning', key: 'project' },
          { name: 'Project Tasks', key: 'Tasks' }, // tasks uses "Tasks" in backend
          { name: 'Milestones', key: 'project' },
          { name: 'Resources', key: 'project' },
          { name: 'Timesheets', key: 'time' },
          { name: 'Issues', key: 'project' },
          { name: 'Change Requests', key: 'project' }
        ]
      },
      {
        name: 'Finance',
        modules: [
          { name: 'Budgets', key: 'project' },
          { name: 'Project Expenses', key: 'project' },
          { name: 'Billing', key: 'project' },
          { name: 'Profitability', key: 'project' }
        ]
      },
      {
        name: 'Support',
        modules: [
          { name: 'Warranty', key: 'warranty' },
          { name: 'AMC', key: 'amc' },
          { name: 'Tickets', key: 'ticket' }
        ]
      }
    ]
  },
  {
    name: 'HR',
    sections: [
      {
        name: 'Employees',
        modules: [
          { name: 'Employees', key: 'employee' },
          { name: 'Attendance', key: 'attendance' }
        ]
      },
      {
        name: 'Workforce Management',
        modules: [
          { name: 'Leave Management', key: 'leave' },
          { name: 'Payroll', key: 'payroll' },
          { name: 'Overtime', key: 'overtime' },
          { name: 'Loans & Advances', key: 'loan' }
        ]
      },
      {
        name: 'Employee Requests',
        modules: [
          { name: 'Bank Requests', key: 'bankchange' },
          { name: 'Employee Documents', key: 'document' }
        ]
      },
      {
        name: 'Analytics',
        modules: [
          { name: 'HR Analytics', key: 'report' }
        ]
      }
    ]
  },
  {
    name: 'System Settings',
    sections: [
      {
        name: 'Business Settings',
        modules: [
          { name: 'General Info', key: 'settings_general' },
          { name: 'Location', key: 'settings_location' },
          { name: 'Tax Registration', key: 'settings_tax' },
          { name: 'Financial', key: 'settings_finance' },
          { name: 'Banking', key: 'settings_banking' },
          { name: 'Invoice Settings', key: 'settings_invoice' },
          { name: 'Inventory Settings', key: 'settings_inventory' },
          { name: 'HR Settings', key: 'settings_hr' },
          { name: 'Compliance', key: 'settings_compliance' },
          { name: 'Security', key: 'settings_security' }
        ]
      },
      {
        name: 'Administration',
        modules: [
          { name: 'Documents', key: 'document' },
          { name: 'System Reports', key: 'report' },
          { name: 'Masters', key: 'settings' },
          { name: 'Contract', key: 'contract' },
          { name: 'Statutory Reports', key: 'report' },
          { name: 'User Management', key: 'user' },
          { name: 'Roles', key: 'settings' }
        ]
      }
    ]
  }
]

// Pre-compute flat list of modules from tree (we use a set to avoid duplicates since multiple UI items map to same backend key)
const ALL_MODULES = Array.from(new Set(PERMISSION_TREE.flatMap(category => 
  category.sections.flatMap(section => 
    section.modules.map(mod => mod.key)
  )
))).map(key => ({
  name: key,
  actions: ['read', 'create', 'update', 'delete']
}))

const emptyCrud: CrudPermissions = {
  read: false,
  create: false,
  update: false,
  delete: false,
}

export function UserDetailPageClient({
  businessId,
  userId,
}: {
  businessId: string
  userId: string
}) {
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [permissions, setPermissions] = useState<Record<string, CrudPermissions>>({})
  const [user, setUser] = useState<UserItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  
  const { business } = useBusinessData()
  const isBasic = business?.businessType?.toLowerCase() === 'basic'

  const filteredTree = useMemo(() => {
    if (!isBasic) return PERMISSION_TREE;
    
    return PERMISSION_TREE.map(category => {
      if (category.name === 'Inventory' || category.name === 'HR') return null;
      
      let newCategory = { ...category };

      if (category.name === 'Sales') {
        newCategory.sections = category.sections.map(section => {
          if (section.name === 'CRM & Customers') {
            return { ...section, modules: section.modules.filter(m => m.name === 'Customers') }
          }
          if (section.name === 'Sales Operations') {
            return { ...section, modules: section.modules.filter(m => ['Quotations', 'Invoices', 'Payments', 'Credit Notes'].includes(m.name)) }
          }
          if (['Activities', 'Marketing', 'Analytics'].includes(section.name)) {
            return null;
          }
          return section;
        }).filter(Boolean) as typeof category.sections;
      }

      if (category.name === 'Procurement') {
        newCategory.sections = category.sections.map(section => {
          if (section.name === 'Vendors') {
            return { ...section, modules: section.modules.filter(m => m.name === 'Vendors') }
          }
          return null;
        }).filter(Boolean) as typeof category.sections;
      }

      if (category.name === 'Accounting & Finance') {
        newCategory.sections = category.sections.map(section => {
          if (section.name === 'Accounting') {
            return { ...section, modules: section.modules.filter(m => m.name === 'Expenses') }
          }
          return null;
        }).filter(Boolean) as typeof category.sections;
      }

      if (category.name === 'Project Operations') {
        newCategory.sections = [
          {
            name: 'Dashboard',
            modules: [{ name: 'Project Dashboard', key: 'project' }]
          },
          {
            name: 'Project',
            modules: [{ name: 'Projects', key: 'project' }]
          },
          {
            name: 'Documents',
            modules: [{ name: 'Documents', key: 'document' }]
          },
          {
            name: 'Reports',
            modules: [{ name: 'System Reports', key: 'report' }]
          },
          {
            name: 'Masters',
            modules: [{ name: 'Masters', key: 'settings' }]
          }
        ];
      }

      return newCategory;
    }).filter(Boolean) as typeof PERMISSION_TREE;
  }, [isBasic]);

  const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '')
  
  const getCookie = React.useCallback((name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }, [])

  const resolvedBusinessId = useMemo(() => {
    const fromProp = (businessId || '').trim()
    if (fromProp && fromProp !== 'undefined' && fromProp !== 'null') return fromProp

    const fromCookie = (getCookie('activeBusinessId') || '').trim()
    if (fromCookie && fromCookie !== 'undefined' && fromCookie !== 'null') return fromCookie

    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/dashboard\/([^/]+)/)
      const fromPath = match?.[1] ? decodeURIComponent(match[1]) : ''
      if (fromPath && fromPath !== 'undefined' && fromPath !== 'null') return fromPath
    }

    return ''
  }, [businessId, getCookie])

  const toUserList = React.useCallback((payload: any): UserItem[] => {
    const rawList = payload?.data || payload?.users || payload || []
    return rawList.map((u: any) => ({
      membershipId: u.id,
      userId: u.user?.id || '',
      name: u.user?.name || '',
      email: u.user?.email || '',
      role: u.role?.name || '',
      status: u.isActive ? 'Active' : 'Disabled',
      createdDate: u.createdAt || '',
      directPermissions: (u.userPermissions || []).map((up: any) => ({
        module: up.permission?.module?.name,
        action: up.permission?.action,
      })).filter((p: any) => p.module && p.action),
    }))
  }, [])

  const getDefaultPermissionsFromModules = React.useCallback(() => {
    const map: Record<string, CrudPermissions> = {}
    for (const m of ALL_MODULES) {
      map[m.name] = {
        read: false,
        create: false,
        update: false,
        delete: false,
      }
    }
    return map
  }, [])

  const applyUserPermissions = React.useCallback((currentUser: UserItem | null) => {
    const base = getDefaultPermissionsFromModules()
    if (!currentUser) return base

    if (currentUser.role === 'Admin') {
      for (const key of Object.keys(base)) {
        base[key] = { read: true, create: true, update: true, delete: true }
      }
      return base
    }

    for (const p of currentUser.directPermissions) {
      const moduleKey = Object.keys(base).find(
        (key) => key.toLowerCase() === String(p.module || '').toLowerCase(),
      )
      if (!moduleKey) continue

      if (p.action in base[moduleKey]) {
        ;(base[moduleKey] as any)[p.action] = true
      }
    }
    return base
  }, [getDefaultPermissionsFromModules])

  const fetchUserDetail = React.useCallback(async () => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!resolvedBusinessId) {
      throw new Error('Missing business id in route/context')
    }
    const res = await fetch(`${API_BASE}/api/user-management`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': resolvedBusinessId,
      },
    })
    const payload = await res.json()
    if (!res.ok || !payload?.success) {
      throw new Error(payload?.message || 'Failed to load users')
    }

    const list = toUserList(payload)
    return list.find((u) => u.userId === userId) || null
  }, [API_BASE, getCookie, resolvedBusinessId, toUserList, userId])

  const fetchUserPermissions = React.useCallback(async (targetUserId: string) => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!resolvedBusinessId) {
      throw new Error('Missing business id in route/context')
    }

    const res = await fetch(`${API_BASE}/api/permissions/user/${encodeURIComponent(targetUserId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': resolvedBusinessId,
      },
    })

    const payload = await res.json()
    if (!res.ok || !payload?.success) {
      throw new Error(payload?.message || 'Failed to load user permissions')
    }

    const list = Array.isArray(payload?.data) ? payload.data : []
    return list
      .map((item: any) => ({
        module: String(item?.module || '').toLowerCase(),
        action: String(item?.action || '').toLowerCase(),
      }))
      .filter((item: any) => item.module && item.action)
  }, [API_BASE, getCookie, resolvedBusinessId])

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const foundUser = await fetchUserDetail()

      if (!foundUser) {
        setUser(null)
        setPermissions(applyUserPermissions(null))
        return
      }

      const savedPermissions = await fetchUserPermissions(foundUser.userId)
      const hydratedUser: UserItem = {
        ...foundUser,
        directPermissions: savedPermissions,
      }

      setUser(hydratedUser)
      setPermissions(applyUserPermissions(hydratedUser))
    } catch (error: any) {
      toast({
        title: 'Failed to load user details',
        description: error?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [applyUserPermissions, fetchUserDetail, fetchUserPermissions])

  useEffect(() => {
    const storedName = window.localStorage.getItem('businessName')
    if (storedName) {
      setBusinessName(storedName)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handlePermissionChange = (module: string, action: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...(prev[module] || emptyCrud),
        [action]: value
      }
    }))
  }

  const handleSavePermissions = async () => {
    if (!user?.userId) {
      toast({
        title: 'Save failed',
        description: 'User id not found.',
        variant: 'destructive',
      })
      return
    }

    if (!resolvedBusinessId) {
      toast({
        title: 'Save failed',
        description: 'Business id is missing.',
        variant: 'destructive',
      })
      return
    }

    const token = getCookie('token') || getCookie('accessToken')
    const crudActions: Array<keyof CrudPermissions> = ['read', 'create', 'update', 'delete']

    try {
      setIsSaving(true)

      for (const moduleItem of ALL_MODULES) {
        const moduleName = moduleItem.name
        const availableActions = new Set(
          (moduleItem.actions || []).map((action) => String(action).toLowerCase()),
        )

        const resetActions = crudActions.filter((action) => availableActions.has(action))
        const selectedActions = crudActions.filter(
          (action) => availableActions.has(action) && Boolean(permissions[moduleName]?.[action]),
        )

        const removeRes = await fetch(
          `${API_BASE}/api/permissions/remove/${encodeURIComponent(user.userId)}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'x-business-id': resolvedBusinessId,
            },
            body: JSON.stringify({
              module: moduleName,
              actions: resetActions,
            }),
          },
        )

        const removePayload = await removeRes.json()
        if (!removeRes.ok || !removePayload?.success) {
          throw new Error(removePayload?.message || `Failed to remove ${moduleName} permissions`)
        }

        if (selectedActions.length > 0) {
          const assignRes = await fetch(
            `${API_BASE}/api/permissions/assign/${encodeURIComponent(user.userId)}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'x-business-id': resolvedBusinessId,
              },
              body: JSON.stringify({
                module: moduleName,
                actions: selectedActions,
              }),
            },
          )

          const assignPayload = await assignRes.json()
          if (!assignRes.ok || !assignPayload?.success) {
            throw new Error(assignPayload?.message || `Failed to assign ${moduleName} permissions`)
          }
        }
      }

      const syncedPermissions = ALL_MODULES.flatMap((moduleItem) => {
        const moduleName = moduleItem.name
        const availableActions = new Set(
          (moduleItem.actions || []).map((action) => String(action).toLowerCase()),
        )

        return crudActions
          .filter(
            (action) =>
              availableActions.has(action) &&
              Boolean(permissions[moduleName]?.[action]),
          )
          .map((action) => ({
            module: moduleName,
            action,
          }))
      })

      setUser((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          directPermissions: syncedPermissions,
        }
      })

      const refreshedPermissions = await fetchUserPermissions(user.userId)
      setUser((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          directPermissions: refreshedPermissions,
        }
      })
      setPermissions(applyUserPermissions({
        ...(user as UserItem),
        directPermissions: refreshedPermissions,
      }))

      setIsEditing(false)
      toast({
        title: 'Permissions updated successfully',
        description: `${user.name} can now access only granted features.`,
      })
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error?.message || 'Unable to update permissions.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'destructive'
      case 'Manager': return 'default'
      case 'Accountant': return 'secondary'
      case 'Viewer': return 'outline'
      default: return 'outline'
    }
  }

  const userAvatar = useMemo(() => {
    if (!user?.name) return 'U'
    return user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [user])

  const formattedCreatedDate = useMemo(() => {
    if (!user?.createdDate) return '-'
    const date = new Date(user.createdDate)
    if (Number.isNaN(date.getTime())) return user.createdDate
    return date.toLocaleDateString()
  }, [user?.createdDate])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading user details...
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <UserIcon className="size-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">User not found</h3>
            <p className="text-muted-foreground">The user you're looking for doesn't exist.</p>
            <Link to={`/dashboard/${businessId}/users`}>
              <Button className="mt-4">
                <ArrowLeftIcon className="mr-2 size-4" />
                Back to Users
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      {/* Top bar */}
      <div className="-mx-4 border-b border-border bg-background px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link to={`/dashboard/${businessId}/users`}>
              <Button className="text-foreground" variant="ghost" size="icon-sm">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">User Details</span>
              <span className="text-xs text-muted-foreground">
                Manage user permissions and settings
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DashboardModeToggle className="hidden sm:inline-flex bg-card text-foreground border-border" />
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />
            <NotificationBell />
            <Link to={`/dashboard/${resolvedBusinessId || businessId}/approvals`}>
              <div className="flex items-center justify-center size-9 rounded-full border border-green-200 bg-green-50 text-green-600 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors" title="Approvals">
                <CheckCircle2Icon className="size-4" />
              </div>
            </Link>
            <UserMenu />
          </div>
        </header>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-linear-to-br from-emerald-500 via-sky-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold mb-4">
                {userAvatar}
              </div>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <div className="flex justify-center gap-2 mt-2">
                <Badge variant={getRoleColor(user.role)} className="text-xs">
                  {user.role}
                </Badge>
                <Badge variant={user.status === 'Active' ? 'secondary' : 'outline'} className="text-xs px-3 py-1">
                  {user.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <MailIcon className="size-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building2Icon className="size-4 text-muted-foreground" />
                  <span>{businessName || 'Business'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  <span>Joined {formattedCreatedDate}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <EyeIcon className="size-4 text-muted-foreground" />
                  <span>Member ID {user.membershipId}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Permissions Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  Manage what this user can access and modify in your business.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSavePermissions} disabled={isSaving}>
                      <SaveIcon className="mr-2 size-4" />
                      {isSaving ? 'Saving...' : 'Save Permissions'}
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3Icon className="mr-2 size-4" />
                    Edit Permissions
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <Accordion type="multiple" className="w-full">
                {filteredTree.map((category) => (
                  <AccordionItem key={category.name} value={category.name} className="border rounded-lg mb-4 bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <ShieldIcon className="size-5 text-muted-foreground" />
                        <span className="font-semibold text-base">{category.name} Module</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="space-y-8 pl-8 border-l border-border dark:border-slate-800 ml-2">
                        {category.sections.map(section => (
                          <div key={section.name} className="space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{section.name}</h4>
                            <div className="grid gap-3">
                              {section.modules.map(mod => (
                                <div key={mod.name} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border rounded-md bg-muted/20">
                                  <div className="font-medium">{mod.name}</div>
                                  <div className="flex flex-wrap items-center gap-4">
                                    {[
                                      { key: 'read', label: 'View', icon: EyeIcon },
                                      { key: 'create', label: 'Add', icon: PlusIcon },
                                      { key: 'update', label: 'Edit', icon: Edit3Icon },
                                      { key: 'delete', label: 'Delete', icon: TrashIcon },
                                    ].map((action) => (
                                      <div key={action.key} className="flex items-center gap-2">
                                        <Switch
                                          id={`${mod.name}-${action.key}`}
                                          checked={Boolean(permissions[mod.key]?.[action.key as keyof CrudPermissions])}
                                          onCheckedChange={(checked) => handlePermissionChange(mod.key, action.key, checked)}
                                          disabled={!isEditing}
                                        />
                                        <label 
                                          htmlFor={`${mod.name}-${action.key}`}
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5"
                                        >
                                          <action.icon className="size-3.5 text-muted-foreground" />
                                          {action.label}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
