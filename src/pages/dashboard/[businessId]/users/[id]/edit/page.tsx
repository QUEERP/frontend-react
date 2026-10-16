import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, Mail, Shield, CheckCircle, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
import { NotificationBell } from '@/components/dashboard/notification-bell'
import { UserMenu } from '@/components/dashboard/user-menu'

const ROLES = ['Admin', 'Manager', 'Accountant', 'User', 'Viewer'] as const

export default function EditUserPage() {
  const { businessId, id } = useParams<{ businessId: string; id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [membershipId, setMembershipId] = useState<string>('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('User')
  const [status, setStatus] = useState<'Active' | 'Disabled'>('Active')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const getCookie = (cookieName: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + cookieName.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)')
    )
    return match ? decodeURIComponent(match[1]) : ''
  }

  useEffect(() => {
    async function loadUser() {
      if (!businessId || !id) return
      try {
        setIsLoading(true)
        const token = getCookie('token') || getCookie('accessToken')
        const res = await fetch(`${API_BASE}/api/user-management`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          },
        })
        const data = await res.json()
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load user')
        }

        const rawList = data.data || data.users || []
        const found = rawList.find(
          (u: any) => u.user?.id === id || u.id === id || u.userId === id
        )

        if (!found) {
          throw new Error('User not found in this business')
        }

        setMembershipId(found.id)
        setName(found.user?.name || '')
        setEmail(found.user?.email || '')
        setRole(found.role?.name || 'User')
        setStatus(found.isActive ? 'Active' : 'Disabled')
      } catch (err: any) {
        toast({
          title: 'Error loading user',
          description: err?.message || 'Could not fetch user information',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    void loadUser()
  }, [businessId, id, API_BASE])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter the user\'s name.',
        variant: 'destructive',
      })
      return
    }

    if (!email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      })
      return
    }

    if (password.trim() && password.trim().length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      })
      return
    }

    const targetId = membershipId || id
    if (!targetId) {
      toast({
        title: 'Error',
        description: 'User identifier not found.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSaving(true)
      const token = getCookie('token') || getCookie('accessToken')

      const bodyPayload: Record<string, any> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        roleName: role,
        status,
        isActive: status === 'Active',
      }

      if (password.trim()) {
        bodyPayload.password = password.trim()
      }

      const res = await fetch(`${API_BASE}/api/user-management/${encodeURIComponent(targetId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId!,
        },
        body: JSON.stringify(bodyPayload),
      })

      const data = await res.json()

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to update user')
      }

      toast({
        title: 'User updated',
        description: `${name} has been updated successfully.`,
      })

      navigate(`/dashboard/${businessId}/users/${id}`)
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err?.message || 'Unable to update user. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading user details...
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
            <Link to={`/dashboard/${businessId}/users/${id}`}>
              <Button className="text-foreground" variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">Edit User</span>
              <span className="text-xs text-muted-foreground">
                Update account info, roles, and status
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DashboardModeToggle className="hidden sm:inline-flex bg-card text-foreground border-border" />
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
      </div>

      <div className="max-w-2xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Edit User Information</CardTitle>
            <CardDescription>
              Changes made here will be reflected across business permissions and team access.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="page-user-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="page-user-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="page-user-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="page-user-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="page-user-role">Business Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="page-user-role" className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="page-user-status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(val) => setStatus(val as 'Active' | 'Disabled')}
                  >
                    <SelectTrigger id="page-user-status" className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="page-user-password">
                  Reset Password <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="page-user-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="pl-9 pr-10"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Leave this field empty if you do not want to change the password.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/dashboard/${businessId}/users/${id}`)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
