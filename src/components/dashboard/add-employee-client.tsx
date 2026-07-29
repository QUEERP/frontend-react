import { toast } from 'sonner';
import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import {  useNavigate  } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, SaveIcon, TrashIcon, UserPlusIcon, Loader2Icon, Briefcase, Mail, Phone, Lock, Calendar, Banknote, UserIcon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
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
import { UserMenu } from './user-menu'

export function AddEmployeeClient({ businessId }: { businessId: string }) {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    designation: '',
    joinDate: '',
    basicSalary: '',
  })
  const [allowance, setAllowance] = useState<Array<{ name: string; amount: string }>>([
    { name: '', amount: '' },
  ])
  const [deduction, setDeduction] = useState<Array<{ name: string; amount: string }>>([
    { name: '', amount: '' },
  ])

  const API_BASE = import.meta.env.VITE_API_BASE || ''

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleLineItemChange = (
    type: 'allowance' | 'deduction',
    index: number,
    field: 'name' | 'amount',
    value: string,
  ) => {
    const setter = type === 'allowance' ? setAllowance : setDeduction
    setter((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const addLineItem = (type: 'allowance' | 'deduction') => {
    const setter = type === 'allowance' ? setAllowance : setDeduction
    setter((prev) => [...prev, { name: '', amount: '' }])
  }

  const removeLineItem = (type: 'allowance' | 'deduction', index: number) => {
    const setter = type === 'allowance' ? setAllowance : setDeduction
    setter((prev) => {
      if (prev.length === 1) {
        return [{ name: '', amount: '' }]
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const normalizeLineItems = (items: Array<{ name: string; amount: string }>) => {
    return items
      .filter((item) => item.name.trim().length > 0 && item.amount.trim().length > 0)
      .map((item) => ({
        name: item.name.trim(),
        amount: Number(item.amount),
      }))
      .filter((item) => !Number.isNaN(item.amount) && item.amount >= 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Employee name is required.',
        variant: 'destructive',
      })
      return
    }

    if (!formData.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Employee email is required.',
        variant: 'destructive',
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a valid email address.',
        variant: 'destructive',
      })
      return
    }

    if (!formData.password.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Password is required.',
        variant: 'destructive',
      })
      return
    }

    if (formData.password.trim().length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Password and confirm password must match.',
        variant: 'destructive',
      })
      return
    }

    if (!formData.basicSalary.trim() || Number(formData.basicSalary) < 0) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a valid basic salary.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const allowancePayload = normalizeLineItems(allowance)
      const deductionPayload = normalizeLineItems(deduction)
      const res = await fetch(`${API_BASE}/api/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
          designation: formData.designation.trim() || undefined,
          joinDate: formData.joinDate ? new Date(formData.joinDate).toISOString() : undefined,
          basicSalary: Number(formData.basicSalary),
          allowance: allowancePayload,
          deduction: deductionPayload,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to create employee')
      }

      toast({
        title: 'Employee created',
        description: `${formData.name} has been added successfully.`,
      })

      navigate(`/dashboard/${businessId}/employees`)
    } catch (err: any) {
      toast({
        title: 'Failed to create employee',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-muted/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/dashboard/${businessId}/employees`}>
          <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 border-border dark:border-slate-800 bg-card dark:bg-slate-900 hover:bg-muted dark:hover:bg-slate-800 transition-colors shadow-sm">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Add New Employee
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create a new employee record and set up their payroll</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-4 bg-muted/50 dark:bg-slate-900/50">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <UserPlusIcon className="h-5 w-5 text-blue-500" />
                Employee Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5" /> Employee Name *
                  </label>
                  <Input
                    placeholder="Enter employee name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter employee email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Password *
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    minLength={6}
                    className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Confirm Password *
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    minLength={6}
                    className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Phone Number
                  </label>
                  <Input
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Position / Role
                  </label>
                  <Input
                    placeholder="e.g., Accountant"
                    value={formData.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Joining Date
                  </label>
                  <Input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => handleInputChange('joinDate', e.target.value)}
                    className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5" /> Basic Salary *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter basic salary"
                    value={formData.basicSalary}
                    onChange={(e) => handleInputChange('basicSalary', e.target.value)}
                    required
                    className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
                  />
                </div>
              </div>

              {/* Payroll Settings Separator */}
              <div className="pt-4 border-t border-border dark:border-slate-800/60">
                <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-500" />
                  Payroll Configurations
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Allowances */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border dark:border-slate-800/60">
                      <Label className="text-emerald-600 dark:text-emerald-400 font-semibold">Allowances</Label>
                      <Button type="button" variant="outline" size="sm" className="gap-1 rounded-xl h-8 text-xs border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900/50 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400" onClick={() => addLineItem('allowance')}>
                        <PlusIcon className="h-3 w-3" />
                        Add Line
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {allowance.map((item, index) => (
                        <div key={`allowance-${index}`} className="flex gap-2 items-start">
                          <Input
                            placeholder="e.g. Housing"
                            value={item.name}
                            onChange={(e) => handleLineItemChange('allowance', index, 'name', e.target.value)}
                            className="rounded-xl transition-all focus:ring-2 focus:ring-emerald-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10 flex-1"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Amount"
                            value={item.amount}
                            onChange={(e) => handleLineItemChange('allowance', index, 'amount', e.target.value)}
                            className="rounded-xl transition-all focus:ring-2 focus:ring-emerald-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10 w-28"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                            onClick={() => removeLineItem('allowance', index)}
                            aria-label="Remove allowance"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border dark:border-slate-800/60">
                      <Label className="text-amber-600 dark:text-amber-400 font-semibold">Deductions</Label>
                      <Button type="button" variant="outline" size="sm" className="gap-1 rounded-xl h-8 text-xs border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-900/50 dark:hover:bg-amber-900/30 dark:hover:text-amber-400" onClick={() => addLineItem('deduction')}>
                        <PlusIcon className="h-3 w-3" />
                        Add Line
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {deduction.map((item, index) => (
                        <div key={`deduction-${index}`} className="flex gap-2 items-start">
                          <Input
                            placeholder="e.g. Tax"
                            value={item.name}
                            onChange={(e) => handleLineItemChange('deduction', index, 'name', e.target.value)}
                            className="rounded-xl transition-all focus:ring-2 focus:ring-amber-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10 flex-1"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Amount"
                            value={item.amount}
                            onChange={(e) => handleLineItemChange('deduction', index, 'amount', e.target.value)}
                            className="rounded-xl transition-all focus:ring-2 focus:ring-amber-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10 w-28"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                            onClick={() => removeLineItem('deduction', index)}
                            aria-label="Remove deduction"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Link to={`/dashboard/${businessId}/employees`}>
              <Button type="button" variant="outline" className="rounded-xl h-11 px-6 border-border dark:border-slate-800 bg-card dark:bg-slate-950">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="gap-2 rounded-xl h-11 px-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm transition-all hover:shadow-md">
              {isSubmitting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
              {isSubmitting ? 'Saving...' : 'Save Employee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
