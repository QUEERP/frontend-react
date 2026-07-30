import { toast } from 'sonner';
import React, { useState } from 'react'
import {  useNavigate  } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  Lock,
  Mail,
  User,
  Shield
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AddUserPageClient({ businessId }: { businessId: string }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleName: 'User'
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '')

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      const token = getCookie('token') || getCookie('accessToken')
      
      const res = await fetch(`${API_BASE}/api/user-management`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roleName: formData.roleName
        }),
      })

      const payload = await res.json()

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to create user')
      }

      toast({
        title: 'Success',
        description: payload.message || 'User created successfully.',
      })

      // Navigate to the user's permissions page (which is the user detail view)
      const membershipId = payload.data?.id
      if (membershipId) {
        navigate(`/dashboard/${businessId}/users/${membershipId}`)
      } else {
        navigate(`/dashboard/${businessId}/users`)
      }
      
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create user',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/dashboard/${businessId}/users`)}
          className="rounded-full hover:bg-muted dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-slate-100">Add New User</h1>
          <p className="text-sm text-muted-foreground">Create a new user account and assign them to your business.</p>
        </div>
      </div>

      <Card className="border-border dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-blue-50/50 dark:bg-blue-900/10 px-6 py-4 border-b border-border dark:border-slate-800 flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
            <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground dark:text-slate-200">User Information</h2>
            <p className="text-xs text-muted-foreground">Enter the basic details and credentials for the new user.</p>
          </div>
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-foreground dark:text-slate-300 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. John Doe"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-muted dark:bg-slate-900/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground dark:text-slate-300 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="e.g. john@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-muted dark:bg-slate-900/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground dark:text-slate-300 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-400" />
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-muted dark:bg-slate-900/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground dark:text-slate-300 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-400" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-muted dark:bg-slate-900/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleName" className="text-sm font-semibold text-foreground dark:text-slate-300 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-400" />
                  Initial Role
                </Label>
                <Select
                  value={formData.roleName}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, roleName: val }))}
                >
                  <SelectTrigger className="bg-muted dark:bg-slate-900/50">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Accountant">Accountant</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">You will assign detailed module permissions on the next screen.</p>
              </div>

            </div>

            <div className="flex items-center justify-end pt-4 border-t border-border dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(`/dashboard/${businessId}/users`)}
                className="mr-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
