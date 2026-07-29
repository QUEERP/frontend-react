import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom';
import { 
  Loader2Icon, 
  CheckIcon, 
  XIcon, 
  CreditCardIcon, 
  PlusCircleIcon, 
  EyeIcon,
  ShieldCheckIcon,
  BuildingIcon,
  ClockIcon,
  InfoIcon,
  SearchIcon
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
import { UserMenu } from './user-menu'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { useToast } from '@/components/ui/use-toast'

type BankChangeItem = {
  id: string
  employeeName: string
  designation: string
  // Employee's current bank info
  currentBankName: string
  currentAccountNumber: string
  currentCode: string
  currentAccountHolderName: string
  // Requested bank info
  requestedBankName: string
  requestedAccountNumber: string
  requestedCountry: string
  requestedCode: string
  requestedAccountHolderName: string
  requestDate: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNKNOWN'
}

const PAGE_SIZE = 10

export function BankChangeRequestsPageClient({ businessId }: { businessId: string }) {
  const { toast } = useToast()
  const { loading: businessLoading, role } = useBusinessData()
  const isAdmin = !!(role?.name?.toLowerCase().includes('admin'))

  const [requests, setRequests] = useState<BankChangeItem[]>([])
  const [pageLoading, setPageLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Form state
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    country: '',
    Code: '',
    accountHolderName: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const API_BASE = import.meta.env.VITE_API_BASE || ''

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.bankName.trim()) errors.bankName = 'Bank name is required.'
    if (!formData.accountNumber.trim()) errors.accountNumber = 'Account number is required.'
    if (!formData.country.trim()) errors.country = 'Country is required.'
    if (!formData.Code.trim()) errors.Code = 'Bank code / IFSC is required.'
    if (!formData.accountHolderName.trim()) errors.accountHolderName = 'Account holder name is required.'
    return errors
  }

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/bankchanges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify({
          bankName: formData.bankName.trim(),
          accountNumber: formData.accountNumber.trim(),
          country: formData.country.trim(),
          Code: formData.Code.trim(),
          accountHolderName: formData.accountHolderName.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to submit bank change request')
      }

      toast({
        title: 'Request submitted',
        description: 'Your bank change request has been submitted successfully.',
      })

      setFormData({ bankName: '', accountNumber: '', country: '', Code: '', accountHolderName: '' })
      setFormErrors({})
      await fetchRequests()
    } catch (err: any) {
      toast({
        title: 'Submission failed',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const fetchRequests = React.useCallback(async () => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    setPageLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/bankchanges`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to load bank change requests')
      }

      const rows = (Array.isArray(data?.data) ? data.data : []).map((item: any) => {
        const normalizedStatus = String(item?.status || '').trim().toUpperCase()
        const strictStatus: BankChangeItem['status'] =
          ['PENDING', 'APPROVED', 'REJECTED'].includes(normalizedStatus)
            ? (normalizedStatus as BankChangeItem['status'])
            : 'UNKNOWN'

        return {
          id: String(item?.id || ''),
          employeeName: String(item?.employee?.name || ''),
          designation: String(item?.employee?.designation || ''),
          currentBankName: String(item?.employee?.bankName || '-'),
          currentAccountNumber: String(item?.employee?.accountNumber || '-'),
          currentCode: String(item?.employee?.Code || '-'),
          currentAccountHolderName: String(item?.employee?.accountHolderName || '-'),
          requestedBankName: String(item?.bankName || ''),
          requestedAccountNumber: String(item?.accountNumber || ''),
          requestedCountry: String(item?.country || ''),
          requestedCode: String(item?.Code || ''),
          requestedAccountHolderName: String(item?.accountHolderName || ''),
          requestDate: item?.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '',
          status: strictStatus,
        }
      })

      setRequests(rows)
    } catch (err: any) {
      toast({
        title: 'Failed to load bank change requests',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setPageLoading(false)
    }
  }, [API_BASE, businessId, toast])

  useEffect(() => {
    if (!businessLoading) {
      void fetchRequests()
    }
  }, [businessLoading, fetchRequests])

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    setUpdatingId(id)
    try {
      const res = await fetch(`${API_BASE}/api/bankchanges/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify({ status }),
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to ${status.toLowerCase()} request`)
      }

      toast({
        title: `Request ${status.toLowerCase()}`,
        description: `Bank change request has been ${status.toLowerCase()}.`,
      })

      await fetchRequests()
    } catch (err: any) {
      toast({
        title: 'Action failed',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setUpdatingId('')
    }
  }

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return requests
    return requests.filter(
      (item) =>
        item.employeeName.toLowerCase().includes(term) ||
        item.requestedBankName.toLowerCase().includes(term) ||
        item.requestedAccountNumber.toLowerCase().includes(term),
    )
  }, [requests, searchTerm])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE))
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const getStatusBadgeVariant = (
    status: BankChangeItem['status'],
  ): 'secondary' | 'destructive' | 'outline' => {
    if (status === 'APPROVED') return 'secondary'
    if (status === 'REJECTED') return 'destructive'
    return 'outline'
  }

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-muted/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm">
            <BuildingIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Bank Details Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Review and manage employee bank account updates securely.</p>
          </div>
        </div>
      </div>

      {/* Create Bank Change Request Form — only for non-admin (employee) users */}
      {isAdmin ? (
        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 rounded-xl border border-indigo-200 dark:border-indigo-800/40 bg-indigo-50/50 dark:bg-indigo-500/5 px-4 py-3 text-sm text-indigo-700 dark:text-indigo-300">
              <ShieldCheckIcon className="size-5 shrink-0" />
              <span><strong>Admin Mode Active:</strong> You can review, approve, or reject employee bank change requests below.</span>
            </div>
          </CardContent>
        </Card>
      ) : (
      <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/50 dark:bg-slate-900/50">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <CreditCardIcon className="h-5 w-5 text-indigo-500" />
            Request Bank Detail Update
          </CardTitle>
          <CardDescription>
            Submit your new banking information below. Changes require HR approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Bank Name */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bcr-bankName" className="text-xs font-semibold uppercase text-muted-foreground">Bank Name <span className="text-rose-500">*</span></Label>
                <Input
                  id="bcr-bankName"
                  placeholder="e.g. HDFC Bank"
                  value={formData.bankName}
                  onChange={(e) => handleFormChange('bankName', e.target.value)}
                  disabled={submitting}
                  className={`rounded-xl transition-all focus:ring-2 focus:ring-indigo-500/20 bg-card dark:bg-slate-950 h-10 ${formErrors.bankName ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border dark:border-slate-800'}`}
                />
                {formErrors.bankName && (
                  <span className="text-xs text-rose-500 font-medium">{formErrors.bankName}</span>
                )}
              </div>

              {/* Account Number */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bcr-accountNumber" className="text-xs font-semibold uppercase text-muted-foreground">Account Number <span className="text-rose-500">*</span></Label>
                <Input
                  id="bcr-accountNumber"
                  placeholder="e.g. 1234567890"
                  value={formData.accountNumber}
                  onChange={(e) => handleFormChange('accountNumber', e.target.value)}
                  disabled={submitting}
                  className={`rounded-xl transition-all focus:ring-2 focus:ring-indigo-500/20 bg-card dark:bg-slate-950 h-10 ${formErrors.accountNumber ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border dark:border-slate-800'}`}
                />
                {formErrors.accountNumber && (
                  <span className="text-xs text-rose-500 font-medium">{formErrors.accountNumber}</span>
                )}
              </div>

              {/* Country */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bcr-country" className="text-xs font-semibold uppercase text-muted-foreground">Country <span className="text-rose-500">*</span></Label>
                <Select value={formData.country} onValueChange={(value) => handleFormChange('country', value)}>
                  <SelectTrigger className={`w-full rounded-xl transition-all focus:ring-2 focus:ring-indigo-500/20 bg-card dark:bg-slate-950 h-10 ${formErrors.country ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border dark:border-slate-800'}`}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UAE">United Arab Emirates</SelectItem>
                    <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                    <SelectItem value="Qatar">Qatar</SelectItem>
                    <SelectItem value="Kuwait">Kuwait</SelectItem>
                    <SelectItem value="Oman">Oman</SelectItem>
                    <SelectItem value="Bahrain">Bahrain</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.country && (
                  <span className="text-xs text-rose-500 font-medium">{formErrors.country}</span>
                )}
              </div>

              {/* Bank Code / IFSC */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bcr-Code" className="text-xs font-semibold uppercase text-muted-foreground">Bank Code / IFSC <span className="text-rose-500">*</span></Label>
                <Input
                  id="bcr-Code"
                  placeholder="e.g. HDFC0001234"
                  value={formData.Code}
                  onChange={(e) => handleFormChange('Code', e.target.value)}
                  disabled={submitting}
                  className={`rounded-xl transition-all focus:ring-2 focus:ring-indigo-500/20 bg-card dark:bg-slate-950 h-10 ${formErrors.Code ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border dark:border-slate-800'}`}
                />
                {formErrors.Code && (
                  <span className="text-xs text-rose-500 font-medium">{formErrors.Code}</span>
                )}
              </div>

              {/* Account Holder Name */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bcr-accountHolderName" className="text-xs font-semibold uppercase text-muted-foreground">Account Holder Name <span className="text-rose-500">*</span></Label>
                <Input
                  id="bcr-accountHolderName"
                  placeholder="e.g. John Doe"
                  value={formData.accountHolderName}
                  onChange={(e) => handleFormChange('accountHolderName', e.target.value)}
                  disabled={submitting}
                  className={`rounded-xl transition-all focus:ring-2 focus:ring-indigo-500/20 bg-card dark:bg-slate-950 h-10 ${formErrors.accountHolderName ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border dark:border-slate-800'}`}
                />
                {formErrors.accountHolderName && (
                  <span className="text-xs text-rose-500 font-medium">{formErrors.accountHolderName}</span>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={submitting} className="rounded-xl h-10 px-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-sm transition-all hover:shadow-md gap-2 w-full sm:w-auto">
                {submitting ? <Loader2Icon className="size-4 animate-spin" /> : <ShieldCheckIcon className="size-4" />}
                {submitting ? 'Submitting…' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Requests List */}
      <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden flex-1">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <ClockIcon className="size-5 text-indigo-500" />
              Request History
            </CardTitle>
            <CardDescription className="mt-1">
              All employee bank detail change requests for this business.
            </CardDescription>
          </div>
          <div className="relative max-w-sm w-full">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by employee or bank…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 rounded-xl transition-all focus:ring-2 focus:ring-indigo-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10 w-full"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {pageLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2Icon className="mr-2 size-5 animate-spin text-indigo-500" /> Loading bank requests…
            </div>
          ) : paginatedRequests.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <InfoIcon className="h-8 w-8 text-slate-300 dark:text-foreground" />
              {searchTerm ? 'No results match your search.' : 'No bank change requests found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="bg-muted/50 dark:bg-slate-900/50 border-b border-border dark:border-slate-800">
                    <TableHead className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Employee</TableHead>
                    <TableHead className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Current Details</TableHead>
                    <TableHead className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Requested Details</TableHead>
                    <TableHead className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Request Date</TableHead>
                    <TableHead className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Status</TableHead>
                    <TableHead className="text-right px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedRequests.map((item) => {
                    const isUpdating = updatingId === item.id
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/30 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-700 dark:text-blue-300 font-semibold text-xs shadow-sm shrink-0">
                              {getInitials(item.employeeName || 'U')}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground dark:text-slate-100 line-clamp-1">{item.employeeName || '-'}</span>
                              <span className="text-xs text-muted-foreground dark:text-slate-400">{item.designation || 'No Role'}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground dark:text-slate-300">{item.currentBankName}</span>
                            <span className="text-xs font-medium text-muted-foreground">AC: {item.currentAccountNumber}</span>
                            {item.currentCode !== '-' && (
                              <span className="text-xs text-muted-foreground">Code: {item.currentCode}</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-indigo-700 dark:text-indigo-400">{item.requestedBankName || '-'}</span>
                            <span className="text-xs font-medium text-indigo-600/80 dark:text-indigo-400/80">AC: {item.requestedAccountNumber || '-'}</span>
                            {item.requestedCode && (
                              <span className="text-xs text-indigo-600/80 dark:text-indigo-400/80">Code: {item.requestedCode}</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="px-6 py-4 text-muted-foreground dark:text-slate-400 font-medium">
                          {item.requestDate || '-'}
                        </TableCell>

                        <TableCell className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={`font-semibold border px-2.5 py-0.5 ${
                              item.status === 'APPROVED' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                                : item.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/dashboard/${businessId}/bank-change-requests/${item.id}`}>
                              <Button type="button" size="sm" variant="outline" className="rounded-xl h-8 border-border dark:border-slate-800 bg-card dark:bg-slate-950 hover:bg-muted dark:hover:bg-slate-900 gap-1.5 shadow-sm">
                                <EyeIcon className="size-3" />
                                View
                              </Button>
                            </Link>
                            {isAdmin && item.status === 'PENDING' && (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="rounded-xl h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                                  disabled={isUpdating}
                                  onClick={() => void handleStatusUpdate(item.id, 'APPROVED')}
                                >
                                  {isUpdating ? (
                                    <Loader2Icon className="size-3 animate-spin" />
                                  ) : (
                                    <CheckIcon className="size-3" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  className="rounded-xl h-8 bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-sm"
                                  disabled={isUpdating}
                                  onClick={() => void handleStatusUpdate(item.id, 'REJECTED')}
                                >
                                  {isUpdating ? (
                                    <Loader2Icon className="size-3 animate-spin" />
                                  ) : (
                                    <XIcon className="size-3" />
                                  )}
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-900/50 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Showing <span className="text-foreground dark:text-slate-100">{paginatedRequests.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}</span> to <span className="text-foreground dark:text-slate-100">{Math.min(currentPage * PAGE_SIZE, filteredRequests.length)}</span> of {filteredRequests.length} records
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="rounded-xl h-8 border-border dark:border-slate-800 bg-card dark:bg-slate-950"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="rounded-xl h-8 border-border dark:border-slate-800 bg-card dark:bg-slate-950"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
