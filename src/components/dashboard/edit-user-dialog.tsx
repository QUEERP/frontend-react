import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Loader2, Eye, EyeOff, User, Mail, Shield, CheckCircle, Lock } from 'lucide-react'

export interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  user: {
    id?: string
    userId?: string
    membershipId?: string
    name: string
    email: string
    role: string
    status: 'Active' | 'Disabled' | string
  } | null
  onUserUpdated?: (updatedUser: any) => void
}

const ROLES = ['Admin', 'Manager', 'Accountant', 'User', 'Viewer'] as const

export function EditUserDialog({
  open,
  onOpenChange,
  businessId,
  user,
  onUserUpdated,
}: EditUserDialogProps) {
  const { toast } = useToast()
  const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('User')
  const [status, setStatus] = useState<'Active' | 'Disabled'>('Active')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const getCookie = (cookieName: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + cookieName.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)')
    )
    return match ? decodeURIComponent(match[1]) : ''
  }

  useEffect(() => {
    if (user && open) {
      setName(user.name || '')
      setEmail(user.email || '')
      setRole(user.role || 'User')
      setStatus(user.status === 'Disabled' ? 'Disabled' : 'Active')
      setPassword('')
      setShowPassword(false)
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

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

    const targetId = user.membershipId || user.userId || user.id
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
          'x-business-id': businessId,
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

      if (onUserUpdated) {
        onUserUpdated(data.data)
      }

      onOpenChange(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <User className="size-5 text-primary" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update user information, assign their role, or manage active status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-user-name" className="text-sm font-medium">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="edit-user-name"
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
            <Label htmlFor="edit-user-email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="edit-user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Role & Status side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-user-role" className="text-sm font-medium">
                Business Role
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="edit-user-role" className="w-full">
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
              <Label htmlFor="edit-user-status" className="text-sm font-medium">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as 'Active' | 'Disabled')}
              >
                <SelectTrigger id="edit-user-status" className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Password (Optional) */}
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="edit-user-password" className="text-sm font-medium">
              Reset Password <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="edit-user-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep unchanged"
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
              Only enter a value if you wish to reset this user's password (min 6 characters).
            </p>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
