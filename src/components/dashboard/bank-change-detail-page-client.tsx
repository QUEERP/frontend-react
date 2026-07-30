import { toast } from 'sonner';
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CreditCardIcon,
  Loader2Icon,
  CheckIcon,
  XIcon,
  CalendarDaysIcon,
  UserIcon,
  BuildingIcon,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
import { UserMenu } from './user-menu'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { useToast } from '@/components/ui/use-toast'

type BankChangeDetail = {
  id: string
  employeeName: string
  designation: string
  currentBankName: string
  currentAccountNumber: string
  currentCode: string
  currentAccountHolderName: string
  requestedBankName: string
  requestedAccountNumber: string
  requestedCountry: string
  requestedCode: string
  requestedAccountHolderName: string
  requestDate: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNKNOWN'
}

export function BankChangeDetailPageClient({
  businessId,
  requestId,
}: {
  businessId: string
  requestId: string
}) {
  const { toast } = useToast()
  const { loading: businessLoading, role } = useBusinessData()
  const isAdmin = !!(role?.name?.toLowerCase().includes('admin'))

  const [detail, setDetail] = useState<BankChangeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const API_BASE = import.meta.env.VITE_API_BASE || ''

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\^])/g, '\\$1') + '=([^;]*)'),
    )
    return match ? decodeURIComponent(match[1]) : ''
  }

  useEffect(() => {
    if (businessLoading) return

    const fetchDetail = async () => {
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) return

      setLoading(true)
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

        const rows: any[] = Array.isArray(data?.data) ? data.data : []
        const found = rows.find((item) => String(item?.id) === String(requestId))

        if (!found) {
          setDetail(null)
          return
        }

        const normalizedStatus = String(found?.status || '').trim().toUpperCase()
        const strictStatus: BankChangeDetail['status'] = ['PENDING', 'APPROVED', 'REJECTED'].includes(normalizedStatus)
          ? (normalizedStatus as BankChangeDetail['status'])
          : 'UNKNOWN'

        setDetail({
          id: String(found?.id || ''),
          employeeName: String(found?.employee?.name || ''),
          designation: String(found?.employee?.designation || ''),
          currentBankName: String(found?.employee?.bankName || '-'),
          currentAccountNumber: String(found?.employee?.accountNumber || '-'),
          currentCode: String(found?.employee?.Code || '-'),
          currentAccountHolderName: String(found?.employee?.accountHolderName || '-'),
          requestedBankName: String(found?.bankName || ''),
          requestedAccountNumber: String(found?.accountNumber || ''),
          requestedCountry: String(found?.country || ''),
          requestedCode: String(found?.Code || ''),
          requestedAccountHolderName: String(found?.accountHolderName || ''),
          requestDate: found?.createdAt ? new Date(found.createdAt).toISOString().split('T')[0] : '',
          status: strictStatus,
        })
      } catch (err: any) {
        toast({
          title: 'Failed to load request',
          description: err?.message || 'Unknown error',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    void fetchDetail()
  }, [API_BASE, businessId, businessLoading, requestId, toast])

  const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED') => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token || !detail) return

    setUpdating(true)
    try {
      const res = await fetch(
        `${API_BASE}/api/bankchanges/${encodeURIComponent(detail.id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          },
          body: JSON.stringify({ status }),
        },
      )

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to ${status.toLowerCase()} request`)
      }

      toast({
        title: `Request ${status.toLowerCase()}`,
        description: `Bank change request has been ${status.toLowerCase()}.`,
      })

      setDetail((prev) => (prev ? { ...prev, status } : prev))
    } catch (err: any) {
      toast({
        title: 'Action failed',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadgeVariant = (
    status: BankChangeDetail['status'],
  ): 'secondary' | 'destructive' | 'outline' => {
    if (status === 'APPROVED') return 'secondary'
    if (status === 'REJECTED') return 'destructive'
    return 'outline'
  }

  const backHref = `/dashboard/${businessId}/bank-change-requests`

  // Loading state
  if (loading || businessLoading) {
    return (
      <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
        <div className="-mx-4 border-b border-border bg-background px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6">
          <header className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Link to={backHref}>
                <Button variant="ghost" size="icon" className="size-8">
                  <ArrowLeftIcon className="size-4" />
                </Button>
              </Link>
              <span className="text-sm font-semibold text-foreground">Bank Change Request Details</span>
            </div>
            
          </header>
        </div>
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          <Loader2Icon className="mr-2 size-4 animate-spin" /> Loading request details…
        </div>
      </div>
    )
  }

  // Not found
  if (!detail) {
    return (
      <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
        <div className="-mx-4 border-b border-border bg-background px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6">
          <header className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Link to={backHref}>
                <Button variant="ghost" size="icon" className="size-8">
                  <ArrowLeftIcon className="size-4" />
                </Button>
              </Link>
              <span className="text-sm font-semibold text-foreground">Bank Change Request Details</span>
            </div>
            
          </header>
        </div>
        <div className="py-16 text-center text-sm text-muted-foreground">
          Bank change request not found.
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      {/* Sticky header */}
      <div className="-mx-4 border-b border-border bg-background px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link to={backHref}>
              <Button variant="ghost" size="icon" className="size-8">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">Bank Change Request Details</span>
              <span className="text-xs text-muted-foreground">
                Request by {detail.employeeName || 'Employee'}
              </span>
            </div>
          </div>
          
        </header>
      </div>

      {/* Status + Date overview */}
      <div className="flex flex-wrap items-center gap-4">
        <Badge variant={getStatusBadgeVariant(detail.status)} className="text-sm px-3 py-1">
          {detail.status}
        </Badge>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDaysIcon className="size-4" />
          <span>Requested on {detail.requestDate || '-'}</span>
        </div>
      </div>

      {/* Employee Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="size-4" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Employee Name" value={detail.employeeName} />
            <InfoRow label="Designation" value={detail.designation} />
          </div>
        </CardContent>
      </Card>

      {/* Current vs Requested Bank Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BuildingIcon className="size-4" />
              Current Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <InfoRow label="Bank Name" value={detail.currentBankName} />
              <InfoRow label="Account Number" value={detail.currentAccountNumber} />
              <InfoRow label="IFSC / Bank Code" value={detail.currentCode} />
              <InfoRow label="Account Holder Name" value={detail.currentAccountHolderName} />
            </div>
          </CardContent>
        </Card>

        {/* Requested Bank Details */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCardIcon className="size-4" />
              Requested Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <InfoRow label="Bank Name" value={detail.requestedBankName} />
              <InfoRow label="Account Number" value={detail.requestedAccountNumber} />
              <InfoRow label="Country" value={detail.requestedCountry} />
              <InfoRow label="IFSC / Bank Code" value={detail.requestedCode} />
              <InfoRow label="Account Holder Name" value={detail.requestedAccountHolderName} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      {isAdmin && detail.status === 'PENDING' && (
        <Card>
          <CardContent className="pt-6">
            <Separator className="mb-4" />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Take action on this request</p>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  className="gap-1"
                  disabled={updating}
                  onClick={() => void handleStatusUpdate('APPROVED')}
                >
                  {updating ? (
                    <Loader2Icon className="size-3 animate-spin" />
                  ) : (
                    <CheckIcon className="size-3" />
                  )}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  disabled={updating}
                  onClick={() => void handleStatusUpdate('REJECTED')}
                >
                  {updating ? (
                    <Loader2Icon className="size-3 animate-spin" />
                  ) : (
                    <XIcon className="size-3" />
                  )}
                  Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value || '-'}</span>
    </div>
  )
}
