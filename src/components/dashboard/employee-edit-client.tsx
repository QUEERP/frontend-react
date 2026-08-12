import { toast } from 'sonner';
import React, { useEffect, useState } from 'react'
import {  useNavigate  } from 'react-router-dom';
import { ArrowLeftIcon, Loader2Icon, PlusIcon, SaveIcon, TrashIcon, UserIcon, Mail, Phone, Briefcase, Calendar, Banknote, Edit3Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type EmployeeForm = {
  name: string
  email: string
  phone: string
  designation: string
  joinDate: string
  basicSalary: string
}

export function EmployeeEditClient({ businessId, employeeId }: { businessId: string; employeeId: string }) {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [form, setForm] = useState<EmployeeForm>({
    name: '',
    email: '',
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  useEffect(() => {
    const loadEmployee = async () => {
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) return

      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/employees/${encodeURIComponent(employeeId)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          },
        })
        const data = await res.json()
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load employee')
        }

        const employee = data?.data || {}
        const rawAllowance = Array.isArray(employee?.allowance) ? employee.allowance : []
        const rawDeduction = Array.isArray(employee?.deduction) ? employee.deduction : []

        setForm({
          name: String(employee?.name || ''),
          email: String(employee?.email || ''),
          phone: String(employee?.phone || ''),
          designation: String(employee?.designation || ''),
          joinDate: employee?.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : '',
          basicSalary: String(employee?.basicSalary ?? ''),
        })
        setAllowance(
          rawAllowance.length > 0
            ? rawAllowance.map((item: any) => ({
                name: String(item?.name || ''),
                amount: String(item?.amount ?? ''),
              }))
            : [{ name: '', amount: '' }],
        )
        setDeduction(
          rawDeduction.length > 0
            ? rawDeduction.map((item: any) => ({
                name: String(item?.name || ''),
                amount: String(item?.amount ?? ''),
              }))
            : [{ name: '', amount: '' }],
        )
      } catch (err: any) {
        toast({
          title: 'Failed to load employee',
          description: err?.message || 'Unknown error',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    void loadEmployee()
  }, [API_BASE, businessId, employeeId])

  const handleChange = (key: keyof EmployeeForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      toast({ title: 'Validation Error', description: 'Employee name is required.', variant: 'destructive' })
      return
    }

    if (!form.basicSalary.trim() || Number(form.basicSalary) < 0) {
      toast({ title: 'Validation Error', description: 'Please provide a valid basic salary.', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const allowancePayload = normalizeLineItems(allowance)
      const deductionPayload = normalizeLineItems(deduction)
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/employees/${encodeURIComponent(employeeId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          designation: form.designation.trim() || null,
          joinDate: form.joinDate ? new Date(form.joinDate).toISOString() : null,
          basicSalary: Number(form.basicSalary),
          allowance: allowancePayload,
          deduction: deductionPayload,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to update employee')
      }

      toast({ title: 'Employee updated', description: `${form.name} saved successfully.` })
      navigate(`/dashboard/${businessId}/employees`)
    } catch (err: any) {
      toast({ title: 'Failed to update', description: err?.message || 'Unknown error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/employees/${encodeURIComponent(employeeId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to delete employee')
      }

      toast({ title: 'Employee deleted', description: 'The employee has been removed.', variant: 'destructive' })
      navigate(`/dashboard/${businessId}/employees`)
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message || 'Unknown error', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-[400px] items-center justify-center space-y-4">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground">Loading employee data...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-muted/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(`/dashboard/${businessId}/employees`)} className="rounded-xl h-10 w-10 border-border dark:border-slate-800 bg-card dark:bg-slate-900 hover:bg-muted dark:hover:bg-slate-800 transition-colors shadow-sm">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Edit Employee
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Update employee records and modify payroll configurations</p>
          </div>
        </div>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="gap-2 rounded-xl h-10 px-5 shadow-sm">
          <TrashIcon className="h-4 w-4" />
          Delete Record
        </Button>
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-4 bg-muted/50 dark:bg-slate-900/50">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Edit3Icon className="h-5 w-5 text-blue-500" />
                Employee Profile
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
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter employee email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Phone Number
                  </label>
                  <Input
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Position / Role
                  </label>
                  <Input
                    placeholder="e.g., Accountant"
                    value={form.designation}
                    onChange={(e) => handleChange('designation', e.target.value)}
                    className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Joining Date
                  </label>
                  <Input
                    type="date"
                    value={form.joinDate}
                    onChange={(e) => handleChange('joinDate', e.target.value)}
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
                    value={form.basicSalary}
                    onChange={(e) => handleChange('basicSalary', e.target.value)}
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
            <Button type="button" variant="outline" onClick={() => navigate(`/dashboard/${businessId}/employees`)} className="rounded-xl h-11 px-6 border-border dark:border-slate-800 bg-card dark:bg-slate-950">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-2 rounded-xl h-11 px-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm transition-all hover:shadow-md">
              {saving ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-500 flex items-center gap-2">
              <TrashIcon className="h-5 w-5" />
              Delete Employee
            </DialogTitle>
            <DialogDescription className="pt-2">
              This action cannot be undone. Do you really want to permanently delete this employee record?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl border-border dark:border-slate-800 bg-card dark:bg-slate-950" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl gap-2 bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2Icon className="size-4 animate-spin" /> : <TrashIcon className="size-4" />}
              Delete Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
