import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import {  useNavigate  } from 'react-router-dom';
import {
  SearchIcon,
  UserIcon,
  PlusIcon,
  MailIcon,
  MoreHorizontalIcon,
  EyeIcon,
  TrashIcon,
  UserCheckIcon,
  UserXIcon,
  Loader2Icon,
  BellIcon,
  UsersIcon,
  ShieldIcon,
  UserPlusIcon,
  CheckCircle2Icon,
} from 'lucide-react'
import { Link } from 'react-router-dom';
import { NotificationBell } from './notification-bell'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { UserMenu } from './user-menu'
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

const usersData: never[] = []

export function UsersPageClient({ businessId }: { businessId: string }) {
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteSearchTerm, setInviteSearchTerm] = useState('')
  const [isFindingUser, setIsFindingUser] = useState(false)
  const [isInvitingUser, setIsInvitingUser] = useState(false)
  const [selectedInviteUser, setSelectedInviteUser] = useState<{
    id: string
    name: string
    email: string
  } | null>(null)
  const [foundUser, setFoundUser] = useState<{
    id: string
    name: string
    email: string
  } | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBusinessInactiveDialogOpen, setIsBusinessInactiveDialogOpen] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { businessId: ctxBusinessId, business, loading: businessLoading } = useBusinessData()
  const [usersLoading, setUsersLoading] = useState(true)
  const [users, setUsers] = useState<Array<{
    id: string
    name: string
    email: string
    role: string
    status: 'Active' | 'Disabled'
    createdDate: string
    lastLogin: string
    membershipId?: string
  }>>([])
  const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '')
  const getCookie = React.useCallback((name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }, [])

  const resolvedBusinessId = useMemo(() => {
    const fromProp = (businessId || '').trim()
    if (fromProp && fromProp !== 'undefined' && fromProp !== 'null') return fromProp

    const fromContext = (ctxBusinessId || '').trim()
    if (fromContext && fromContext !== 'undefined' && fromContext !== 'null') return fromContext

    const fromCookie = (getCookie('activeBusinessId') || '').trim()
    if (fromCookie && fromCookie !== 'undefined' && fromCookie !== 'null') return fromCookie

    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/dashboard\/([^/]+)/)
      const fromPath = match?.[1] ? decodeURIComponent(match[1]) : ''
      if (fromPath && fromPath !== 'undefined' && fromPath !== 'null') return fromPath
    }

    return ''
  }, [businessId, ctxBusinessId, getCookie])

  const getPermissionAwareMessage = React.useCallback((rawMessage: string, fallback: string) => {
    const message = String(rawMessage || '').trim()
    const normalized = message.toLowerCase()

    if (normalized.includes('permission denied')) {
      if (normalized.includes('user:create')) return "You don't have permission to add users."
      if (normalized.includes('user:read')) return "You don't have permission to view users."
      if (normalized.includes('user:delete')) return "You don't have permission to delete users."
      return "You don't have permission to perform this action."
    }

    return message || fallback
  }, [])

  const fetchUsers = React.useCallback(async (showSuccessToast = true) => {
    setUsersLoading(true)
    try {
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
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(getPermissionAwareMessage(data?.message, 'Failed to load users'))
      }
      const list = (data.data || data.users || data).map((u: any) => ({
        id: u.user?.id || '',
        name: u.user?.name || '',
        email: u.user?.email || '',
        role: u.role?.name || '',
        status: u.isActive ? 'Active' : 'Disabled',
        createdDate: u.createdAt || '',
        membershipId: u.id,
      }))
      setUsers(list)
      if (showSuccessToast) {
        toast({
          title: 'Success',
          description: data?.message || `${list.length} users fetched successfully.`,
        })
      }
    } catch (e: any) {
      toast({
        title: 'Failed to load users',
        description: e?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setUsersLoading(false)
    }
  }, [API_BASE, getCookie, resolvedBusinessId, toast])

  useEffect(() => {
    if (businessLoading) return
    fetchUsers()
  }, [ctxBusinessId, fetchUsers, businessLoading])

  useEffect(() => {
    const storedName = window.localStorage.getItem('businessName')
    if (storedName) {
      setBusinessName(storedName)
    }
  }, [])

  const displayName = useMemo(() => {
    if (businessName && businessName.trim().length > 0) {
      return businessName
    }
    if (!businessId) {
      return 'Your Business'
    }
    return `Business ${businessId.slice(0, 6).toUpperCase()}`
  }, [businessName, businessId])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const base = `${user.name} ${user.email} ${user.id}`.toLowerCase()
      const matchesSearch = base.includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  const stats = useMemo(() => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.status === 'Active').length
    const adminUsers = users.filter(u => u.role === 'Admin').length
    const recentUsers = users.filter(u => {
      if (!u.createdDate) return false
      const createdDate = new Date(u.createdDate)
      if (Number.isNaN(createdDate.getTime())) return false
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return createdDate > thirtyDaysAgo
    }).length
    return {
      totalUsers,
      activeUsers,
      adminUsers,
      recentUsers,
    }
  }, [users])

  const handleDeleteUser = () => {
    if (!deleteUserId) return

    const removeMembership = async () => {
      try {
        const token = getCookie('token') || getCookie('accessToken')
        if (!resolvedBusinessId) {
          throw new Error('Missing business id in route/context')
        }
        const res = await fetch(`${API_BASE}/api/user-management/invite/${encodeURIComponent(deleteUserId)}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': resolvedBusinessId,
          },
        })
        const payload = await res.json()
        if (!res.ok || !payload?.success) {
          throw new Error(getPermissionAwareMessage(payload?.message, 'Failed to remove user'))
        }

        const user = users.find(u => u.membershipId === deleteUserId)
        toast({
          title: 'Success',
          description: payload?.message || `${user?.name || 'User'} has been removed from your business.`,
          variant: 'destructive',
        })
        await fetchUsers(false)
      } catch (error: any) {
        toast({
          title: 'Delete failed',
          description: error?.message || 'Unable to delete user.',
          variant: 'destructive',
        })
      } finally {
        setIsDeleteDialogOpen(false)
        setDeleteUserId(null)
      }
    }

    void removeMembership()
  }

  const openDeleteDialog = (membershipId: string) => {
    setDeleteUserId(membershipId)
    setIsDeleteDialogOpen(true)
  }

  const openInviteDialog = () => {
    setIsInviteDialogOpen(true)
    setInviteSearchTerm('')
    setSelectedInviteUser(null)
    setFoundUser(null)
  }

  const handleFindUser = async () => {
    const email = inviteSearchTerm.trim()
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address to search.',
        variant: 'destructive',
      })
      return
    }
    try {
      setIsFindingUser(true)
      setFoundUser(null)
      setSelectedInviteUser(null)
      const token = getCookie('token')
      const response = await fetch(`${API_BASE}/api/check-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'User not found')
      }
      const u = payload.user
      setFoundUser({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
      })
      toast({
        title: 'Success',
        description: payload?.message || 'User found successfully.',
      })
    } catch (e: any) {
      toast({
        title: 'New User',
        description: 'User not found in system. They will be created. Click below to add them.',
      })
      setFoundUser({
        id: 'new-user',
        name: email.split('@')[0],
        email: email,
      })
    } finally {
      setIsFindingUser(false)
    }
  }

  const handleInviteUser = async () => {
    if (!selectedInviteUser?.email) {
      toast({
        title: 'Warning',
        description: 'Please select a user before inviting.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsInvitingUser(true)
      const token = getCookie('token') || getCookie('accessToken')
      if (!resolvedBusinessId) {
        throw new Error('Missing business id in route/context')
      }
      const response = await fetch(`${API_BASE}/api/user-management/invite`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-business-id': resolvedBusinessId,
        },
        body: JSON.stringify({ email: selectedInviteUser.email }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(getPermissionAwareMessage(payload?.message, 'Failed to invite user'))
      }

      toast({
        title: 'Success',
        description: payload?.message || `${selectedInviteUser.name} has been added to your business.`,
      })
      setIsInviteDialogOpen(false)
      setSelectedInviteUser(null)
      setFoundUser(null)
      setInviteSearchTerm('')
      await fetchUsers(false)
    } catch (error: any) {
      toast({
        title: 'Invite failed',
        description: error?.message || 'Unable to invite user.',
        variant: 'destructive',
      })
    } finally {
      setIsInvitingUser(false)
    }
  }

  const handleAddUserClick = () => {
    if (business?.isActive === false) {
      setIsBusinessInactiveDialogOpen(true)
      return
    }
    navigate(`/dashboard/${businessId}/users/add`)
  }

  const handleContactTeam = () => {
    window.location.href = 'https://www.queinfotech.com/contact'
  }

  if (businessLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">

      {/* KPI cards */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Total Users */}
        <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 dark:border-[#23272c] dark:bg-[#181a20]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
            <CardDescription className="text-[13px] font-medium text-muted-foreground dark:text-slate-400">Total Users</CardDescription>
            <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <UsersIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <CardTitle className="flex items-baseline gap-2 text-2xl font-bold tracking-tight text-foreground dark:text-slate-100">
              {stats.totalUsers}
            </CardTitle>
            <p className="mt-1 text-xs font-medium text-slate-400 dark:text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 dark:border-[#23272c] dark:bg-[#181a20]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
            <CardDescription className="text-[13px] font-medium text-muted-foreground dark:text-slate-400">Active Users</CardDescription>
            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <UserCheckIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <CardTitle className="flex items-baseline gap-2 text-2xl font-bold tracking-tight text-foreground dark:text-slate-100">
              {stats.activeUsers}
            </CardTitle>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-muted-foreground">
              <span className="text-emerald-500 font-semibold">{stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%</span> active
            </p>
          </CardContent>
        </Card>

        {/* Admin Users */}
        <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 dark:border-[#23272c] dark:bg-[#181a20]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
            <CardDescription className="text-[13px] font-medium text-muted-foreground dark:text-slate-400">Admin Users</CardDescription>
            <div className="flex size-9 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <ShieldIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <CardTitle className="flex items-baseline gap-2 text-2xl font-bold tracking-tight text-foreground dark:text-slate-100">
              {stats.adminUsers}
            </CardTitle>
            <p className="mt-1 text-xs font-medium text-slate-400 dark:text-muted-foreground">
              Users with admin privileges
            </p>
          </CardContent>
        </Card>

        {/* New Users */}
        <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 dark:border-[#23272c] dark:bg-[#181a20]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
            <CardDescription className="text-[13px] font-medium text-muted-foreground dark:text-slate-400">New Users</CardDescription>
            <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <UserPlusIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <CardTitle className="flex items-baseline gap-2 text-2xl font-bold tracking-tight text-foreground dark:text-slate-100">
              {stats.recentUsers}
            </CardTitle>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-muted-foreground">
              <span className="text-blue-500 font-semibold">Last 30 days</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-[#23272c] dark:bg-[#181a20]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 pt-6 border-b border-border/60 dark:border-[#23272c] mb-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex size-8 items-center justify-center rounded-full bg-muted dark:bg-[#1c2128]">
              <UserIcon className="size-4 text-muted-foreground dark:text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground dark:text-slate-100">
                User Directory
              </CardTitle>
              <CardDescription className="text-[13px] mt-1 text-muted-foreground dark:text-slate-400">
                View and manage all your business users in one place.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[110px] sm:w-[130px] h-9 text-[13px] rounded-full bg-muted border-border/60 dark:bg-[#181a20] dark:border-[#23272c] focus:ring-blue-500 transition-all">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Accountant">Accountant</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[110px] sm:w-[130px] h-9 text-[13px] rounded-full bg-muted border-border/60 dark:bg-[#181a20] dark:border-[#23272c] focus:ring-blue-500 transition-all">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-9 rounded-full cursor-pointer px-4 flex items-center gap-1.5 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
              onClick={handleAddUserClick}
            >
              <PlusIcon className="size-3.5" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={`users-skeleton-${index}`}>
                    <TableCell>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="ml-auto h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/dashboard/${businessId}/users/${user.id}`)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <MailIcon className="size-3 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === 'Admin' ? 'destructive' :
                          user.role === 'Manager' ? 'default' :
                            user.role === 'Accountant' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === 'Active' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      <div className="flex items-center gap-1">
                        {user.status === 'Active' ? (
                          <UserCheckIcon className="size-3" />
                        ) : (
                          <UserXIcon className="size-3" />
                        )}
                        {user.status}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.createdDate ? new Date(user.createdDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/${businessId}/users/${user.id}`)}>
                          <EyeIcon className="mr-2 size-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => user.membershipId && openDeleteDialog(user.membershipId)}
                        >
                          <TrashIcon className="mr-2 size-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBusinessInactiveDialogOpen} onOpenChange={setIsBusinessInactiveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Business Inactive</DialogTitle>
            <DialogDescription>
              Please contact the Que Info Tech team.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBusinessInactiveDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleContactTeam}>
              Contact Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
