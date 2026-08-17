import { toast } from 'sonner';
import React, { useEffect, useState, useCallback } from 'react'
import {  useNavigate  } from 'react-router-dom';
import { ChevronLeftIcon, StoreIcon, Loader2Icon, IndianRupeeIcon, Building2Icon, MailIcon, PhoneIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { useToast } from '@/components/ui/use-toast'
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton'

type VendorDetail = {
  id: string
  vendorCode: string
  name: string
  vendorType: string
  contactPerson: string
  email: string
  phone: string
  countryCode: string
  taxRegistrationNumber: string
  paymentTerms: string
  currency: string
  openingBalance: number
  balance: number
  creditLimit: number
  preferredVendor: boolean
  status: string
  notes: string
  createdAt: string
}

type ExpenseIncomeItem = {
  id: string
  title: string
  amount: number
  currency: string
  date: string
  category: string
  paymentMethod: string
}

export function ViewVendorClient({ businessId, vendorId }: { businessId: string, vendorId: string }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { currencySymbol } = useBusinessData();
  const businessLoading = (useBusinessData() as any).businessLoading;

  const [vendor, setVendor] = useState<VendorDetail | null>(null)
  const [expenses, setExpenses] = useState<ExpenseIncomeItem[]>([])
  const [loading, setLoading] = useState(true)

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5002'

  const getCookie = useCallback((name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'),
    )
    return match ? decodeURIComponent(match[1]) : ''
  }, [])

  const fetchData = useCallback(async () => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    try {
      // Fetch vendor details
      const vendorRes = await fetch(`${API_BASE}/api/purchase/vendors/${vendorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })
      const vendorData = await vendorRes.json()
      if (vendorRes.ok && vendorData?.success) {
        setVendor(vendorData.vendor || vendorData.data)
      } else {
        throw new Error(vendorData?.message || 'Failed to load vendor details')
      }

      // Fetch expenses for this vendor (Amount Receive / Income)
      const expensesRes = await fetch(`${API_BASE}/api/expenses?vendorId=${vendorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })
      const expensesData = await expensesRes.json()
      if (expensesRes.ok && expensesData?.success) {
        setExpenses(expensesData.data || [])
      }
    } catch (err: any) {
      toast({
        title: 'Error loading data',
        description: err?.message || 'Unknown error occurred.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [API_BASE, businessId, vendorId, getCookie])

  useEffect(() => {
    if (!businessLoading) {
      fetchData()
    }
  }, [businessLoading, fetchData])

  if (businessLoading || loading) {
    return <DashboardPageSkeleton />
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <StoreIcon className="size-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Vendor not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate(`/dashboard/${businessId}/vendors`)}>
          Back to Vendors
        </Button>
      </div>
    )
  }

  const totalReceived = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-24 pt-4 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-4">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/dashboard/${businessId}/vendors`)}
            className="h-9 px-3 rounded-xl hover:bg-slate-200 text-muted-foreground -ml-3"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to Vendors
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-14 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <StoreIcon className="size-7" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
                {vendor.name}
                {vendor.status === 'ACTIVE' ? (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 rounded-md text-[10px] font-bold px-2 py-0.5 tracking-wider">ACTIVE</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 tracking-wider rounded-md text-slate-500 border-slate-300">INACTIVE</Badge>
                )}
              </h1>
              <p className="text-muted-foreground">{vendor.vendorCode} • {vendor.vendorType}</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate(`/dashboard/${businessId}/vendors/${vendor.id}/edit`)}
            className="rounded-xl font-medium"
          >
            Edit Vendor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 shadow-sm md:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Contact Person</p>
              <p className="font-medium">{vendor.contactPerson || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Email</p>
              <div className="flex items-center gap-2">
                <MailIcon className="size-4 text-slate-400" />
                <p className="font-medium text-sm">{vendor.email || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Phone</p>
              <div className="flex items-center gap-2">
                <PhoneIcon className="size-4 text-slate-400" />
                <p className="font-medium text-sm">{vendor.phone ? `${vendor.countryCode} ${vendor.phone}` : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amount Receive / Income Section */}
        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 shadow-sm md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg">Amount Receive</CardTitle>
              <CardDescription>Income generated by this vendor through expenses</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Total Income</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-500">
                {vendor.currency} {totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center size-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                  <IndianRupeeIcon className="size-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No Income Records</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  This vendor doesn't have any recorded expenses that count as income yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-xl">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="text-sm">
                          {exp.date ? new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{exp.title}</TableCell>
                        <TableCell className="text-sm">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                            {exp.category || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">
                          <span className="text-emerald-600 dark:text-emerald-500">
                            + {exp.currency} {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
