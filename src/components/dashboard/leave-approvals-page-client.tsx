import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import { CalendarCheck2Icon, CheckIcon, Loader2Icon, XIcon, CheckCircle2Icon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { useToast } from '@/components/ui/use-toast'

type ApprovalItem = {
  id: string
  type: 'LEAVE' | 'QUOTATION' | 'SALES_ORDER' | 'BANK_CHANGE'
  requestedBy: string
  details: string
  date: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNKNOWN'
  originalId: string
}

export function LeaveApprovalsPageClient({ businessId }: { businessId: string }) {
  const { toast } = useToast()
  const { loading: businessLoading } = useBusinessData()

  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [pageLoading, setPageLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState('')

  const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const fetchApprovals = React.useCallback(async () => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    setPageLoading(true)
    const headers = {
      Authorization: `Bearer ${token}`,
      'x-business-id': businessId,
    }

    try {
      const [leavesRes, bankRes, quoteRes, soRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/leaves`, { headers }),
        fetch(`${API_BASE}/api/bankchanges`, { headers }),
        fetch(`${API_BASE}/api/quotation`, { headers }),
        fetch(`${API_BASE}/api/salesorder`, { headers })
      ])

      const newApprovals: ApprovalItem[] = []

      // Leaves
      if (leavesRes.status === 'fulfilled' && leavesRes.value.ok) {
        const data = await leavesRes.value.json()
        const rows = (Array.isArray(data?.data) ? data.data : []).map((item: any) => ({
          id: `LEAVE-${item.id}`,
          originalId: item.id,
          type: 'LEAVE',
          requestedBy: item?.employee?.name || 'Unknown',
          details: `Leave Type: ${item.leaveCode} | Duration: ${item.duration === 'HALF' ? 'Half Day' : 'Full Day'}`,
          date: item?.date ? new Date(item.date).toISOString().split('T')[0] : '',
          status: String(item?.status || 'PENDING').trim().toUpperCase() as ApprovalItem['status']
        }))
        newApprovals.push(...rows)
      }

      // Bank Changes
      if (bankRes.status === 'fulfilled' && bankRes.value.ok) {
        const data = await bankRes.value.json()
        const rows = (Array.isArray(data?.data) ? data.data : []).map((item: any) => ({
          id: `BANK-${item.id}`,
          originalId: item.id,
          type: 'BANK_CHANGE',
          requestedBy: item?.employee?.name || 'Unknown',
          details: `Bank Name: ${item.bankName} | Acct: ${item.accountNumber}`,
          date: item?.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '',
          status: String(item?.status || 'PENDING').trim().toUpperCase() as ApprovalItem['status']
        }))
        newApprovals.push(...rows)
      }

      // Quotations
      if (quoteRes.status === 'fulfilled' && quoteRes.value.ok) {
        const data = await quoteRes.value.json()
        const rows = (Array.isArray(data?.data) ? data.data : []).map((item: any) => ({
          id: `QUOTE-${item.id}`,
          originalId: item.id,
          type: 'QUOTATION',
          requestedBy: item?.customer?.company || 'Unknown Customer',
          details: `Quote #: ${item.quotationNumber} | Amount: ${item.grandTotal}`,
          date: item?.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '',
          status: String(item?.status || 'PENDING').trim().toUpperCase() as ApprovalItem['status']
        }))
        newApprovals.push(...rows)
      }

      // Sales Orders
      if (soRes.status === 'fulfilled' && soRes.value.ok) {
        const data = await soRes.value.json()
        const rows = (Array.isArray(data?.data) ? data.data : []).map((item: any) => ({
          id: `SO-${item.id}`,
          originalId: item.id,
          type: 'SALES_ORDER',
          requestedBy: item?.customer?.company || 'Unknown Customer',
          details: `Order #: ${item.orderNumber} | Amount: ${item.grandTotal}`,
          date: item?.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '',
          status: String(item?.status || 'PENDING').trim().toUpperCase() as ApprovalItem['status']
        }))
        newApprovals.push(...rows)
      }

      setApprovals(newApprovals)
    } catch (err: any) {
      toast({
        title: 'Failed to load approvals',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setPageLoading(false)
    }
  }, [API_BASE, businessId, toast])

  useEffect(() => {
    if (!businessLoading) {
      void fetchApprovals()
    }
  }, [businessLoading, fetchApprovals])

  const pendingApprovals = useMemo(() => {
    return approvals.filter((item) => item.status === 'PENDING' || item.status === 'PENDING_APPROVAL')
  }, [approvals])

  const handleStatusUpdate = async (item: ApprovalItem, newStatus: 'APPROVED' | 'REJECTED') => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    setUpdatingId(item.id)
    try {
      let endpoint = ''
      let payload = { status: newStatus }
      
      // Map to correct endpoint
      if (item.type === 'LEAVE') {
        endpoint = `${API_BASE}/api/leaves/${item.originalId}/status`
      } else if (item.type === 'BANK_CHANGE') {
        endpoint = `${API_BASE}/api/bankchanges/${item.originalId}/status`
      } else if (item.type === 'QUOTATION') {
        endpoint = `${API_BASE}/api/quotation/${item.originalId}/status`
      } else if (item.type === 'SALES_ORDER') {
        endpoint = `${API_BASE}/api/salesorder/${item.originalId}/status`
      }

      // Fix status name if it's Quotation or Sales Order which might just use standard update or /status
      // Assuming all use a /status PUT method
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify(payload),
      })

      // Try generic update if /status returns 404
      if (res.status === 404 && (item.type === 'QUOTATION' || item.type === 'SALES_ORDER')) {
        const updateEndpoint = item.type === 'QUOTATION' 
          ? `${API_BASE}/api/quotation/${item.originalId}` 
          : `${API_BASE}/api/salesorder/${item.originalId}`
        
        await fetch(updateEndpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          },
          body: JSON.stringify(payload),
        })
      } else {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.message || 'Failed to update status')
        }
      }

      toast({
        title: `Approval ${newStatus.toLowerCase()}`,
        description: `${item.type} has been marked as ${newStatus.toLowerCase()}.`,
      })

      await fetchApprovals()
    } catch (err: any) {
      toast({
        title: 'Failed to update status',
        description: err?.message || `Unknown error`,
        variant: 'destructive',
      })
    } finally {
      setUpdatingId('')
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'LEAVE': return 'Leave Request'
      case 'QUOTATION': return 'Quotation'
      case 'SALES_ORDER': return 'Sales Order'
      case 'BANK_CHANGE': return 'Change Bank Request'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'LEAVE': return 'default'
      case 'QUOTATION': return 'secondary'
      case 'SALES_ORDER': return 'secondary'
      case 'BANK_CHANGE': return 'outline'
      default: return 'default'
    }
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8 w-full min-w-0">
      <div className="-mx-4 border-b border-border bg-background px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">Approvals</span>
              <span className="text-xs text-muted-foreground">Review pending requests across the business</span>
            </div>
          </div>
        </header>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2Icon className="size-5 text-primary" />
            Pending Approvals
          </CardTitle>
          <CardDescription>Approve or reject leave requests, quotations, sales orders, and bank changes.</CardDescription>
        </CardHeader>
        <CardContent>
          {pageLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2Icon className="mr-2 size-4 animate-spin" /> Loading pending approvals...
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No pending approvals found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.map((item) => {
                  const isUpdating = updatingId === item.id
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-sm">
                        <Badge variant={getTypeColor(item.type) as any}>{getTypeLabel(item.type)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{item.requestedBy}</TableCell>
                      <TableCell className="text-sm">{item.details}</TableCell>
                      <TableCell className="text-sm">{item.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{item.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="gap-1"
                            disabled={isUpdating}
                            onClick={() => void handleStatusUpdate(item, 'APPROVED')}
                          >
                            {isUpdating ? <Loader2Icon className="size-3 animate-spin" /> : <CheckIcon className="size-3" />}
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            disabled={isUpdating}
                            onClick={() => void handleStatusUpdate(item, 'REJECTED')}
                          >
                            {isUpdating ? <Loader2Icon className="size-3 animate-spin" /> : <XIcon className="size-3" />}
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
