import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeftIcon, FileTextIcon, Loader2Icon, DollarSignIcon } from 'lucide-react'

import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { getCookie } from '@/lib/utils'
import { getCurrencySymbol } from '@/lib/currencies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton'
import { AddInvoiceClient } from '@/components/dashboard/add-invoice-client'

export function PaymentAllocationPageClient({ businessId, paymentId }: { businessId: string, paymentId: string }) {
  const { loading: businessLoading, currencySymbol } = useBusinessData()
  const navigate = useNavigate()
  const [loadingPayment, setLoadingPayment] = useState(true)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [allocatingPayment, setAllocatingPayment] = useState(false)
  const [allocationAmounts, setAllocationAmounts] = useState<Record<string, string>>({})

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5002'

  const fetchPaymentDetails = async () => {
    try {
      setLoadingPayment(true)
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/payments/details/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId
        }
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch payment details')
      
      setPaymentDetails(data.data)
      
      // If payment has customer, fetch unpaid invoices for them
      if (data.data?.customerId) {
        fetchUnpaidInvoices(data.data.customerId, data.data.projectId, data.data.unappliedBalance)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error fetching payment')
    } finally {
      setLoadingPayment(false)
    }
  }

  const fetchUnpaidInvoices = async (customerId: string, projectId?: string, currentUnappliedBalance?: number) => {
    try {
      setLoadingInvoices(true)
      const token = getCookie('token') || getCookie('accessToken')
      let url = `${API_BASE}/api/customers/${customerId}/unpaid-invoices`
      if (projectId) {
        url += `?projectId=${projectId}`
      }
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId
        }
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch invoices')
      const invoices = data.invoices || data.data || []
      
      // Pre-fill allocation amounts
      if (currentUnappliedBalance && currentUnappliedBalance > 0) {
        const prefilled: Record<string, string> = {}
        invoices.forEach((inv: any) => {
          const amtDue = Number(inv.amountDue || (Number(inv.grandTotal || 0) - Number(inv.amountPaid || 0)) || 0)
          const maxAllowed = Math.min(amtDue, currentUnappliedBalance)
          if (maxAllowed > 0) {
            prefilled[inv.id] = maxAllowed.toString()
          }
        })
        setAllocationAmounts(prefilled)
      }
      
      setUnpaidInvoices(invoices)
    } catch (err: any) {
      toast.error(err.message || 'Error fetching unpaid invoices')
    } finally {
      setLoadingInvoices(false)
    }
  }

  useEffect(() => {
    if (!businessLoading && paymentId) {
      fetchPaymentDetails()
    }
  }, [businessId, businessLoading, paymentId])

  const handleApplyToExisting = async (invoiceId: string) => {
    const amtStr = allocationAmounts[invoiceId]
    const amount = Number(amtStr)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    const invoice = unpaidInvoices.find(inv => inv.id === invoiceId)
    const invAmtDue = invoice ? Number(invoice.amountDue || (Number(invoice.grandTotal || 0) - Number(invoice.amountPaid || 0)) || 0) : 0
    
    const maxAmount = Math.min(
      paymentDetails?.unappliedBalance || 0,
      invAmtDue
    )

    if (amount > maxAmount) {
      toast.error(`Amount cannot exceed ${maxAmount}`)
      return
    }

    try {
      setAllocatingPayment(true)
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/payments/${paymentId}/allocate-existing-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId
        },
        body: JSON.stringify({ invoiceId, amount })
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to allocate')
      
      toast.success('Payment allocated successfully!')
      navigate(`/dashboard/${businessId}/payments`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to allocate payment')
    } finally {
      setAllocatingPayment(false)
    }
  }

  if (businessLoading || loadingPayment) {
    return <DashboardPageSkeleton />
  }

  if (!paymentDetails) {
    return (
      <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="text-center py-20 text-muted-foreground font-semibold">Payment not found</div>
      </div>
    )
  }

  const payCurrency = paymentDetails.currency || currencySymbol
  const currSymbol = getCurrencySymbol(payCurrency)
  const unappliedBalance = Number(paymentDetails.unappliedBalance || 0)

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <header className="flex items-center justify-between gap-4 w-full">
          <div className="flex min-w-0 items-center gap-4">
            <Link to={`/dashboard/${businessId}/payments`}>
              <Button variant="ghost" size="icon" className="h-10 w-10 cursor-pointer text-muted-foreground hover:text-foreground bg-muted hover:bg-muted rounded-xl">
                <ArrowLeftIcon className="size-5" />
              </Button>
            </Link>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hidden sm:block">
              <DollarSignIcon className="h-6 w-6" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-bold text-foreground tracking-tight">Allocate Payment Funds</span>
              <span className="text-sm font-medium text-muted-foreground mt-0.5">
                Apply unallocated balance of {currSymbol}{unappliedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </header>
      </div>

      <Tabs defaultValue="existing" className="w-full h-full flex flex-col gap-4">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2 bg-muted p-1 rounded-xl">
          <TabsTrigger value="existing" className="rounded-lg font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">Apply to Existing</TabsTrigger>
          <TabsTrigger value="new" className="rounded-lg font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">Create New Invoice</TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="mt-0">
          <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-muted/50 border-b border-border pb-6">
              <CardTitle className="text-lg text-foreground">Unpaid Invoices</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingInvoices ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2Icon className="h-8 w-8 animate-spin mb-4 text-emerald-600" />
                  <p className="font-semibold">Loading unpaid invoices...</p>
                </div>
              ) : unpaidInvoices.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                  <FileTextIcon className="h-12 w-12 mb-4 text-slate-300" />
                  <p className="font-semibold">No unpaid invoices found</p>
                  <p className="text-sm">This customer doesn't have any outstanding invoices.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 text-muted-foreground font-semibold">
                      <tr>
                        <th className="px-6 py-4 text-left">Invoice #</th>
                        <th className="px-6 py-4 text-left">Date</th>
                        <th className="px-6 py-4 text-right">Amount Due</th>
                        <th className="px-6 py-4 text-right">Allocate Amount</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {unpaidInvoices.map(inv => {
                        const amtDue = Number(inv.amountDue || (Number(inv.grandTotal || 0) - Number(inv.amountPaid || 0)) || 0)
                        const maxAllowed = Math.min(amtDue, unappliedBalance)
                        return (
                          <tr key={inv.id} className="hover:bg-muted/20">
                            <td className="px-6 py-4 font-medium text-foreground">{inv.invoiceNumber}</td>
                            <td className="px-6 py-4 text-muted-foreground">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right font-bold text-foreground">
                              {currSymbol}{amtDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                max={maxAllowed}
                                value={allocationAmounts[inv.id] || ''}
                                onChange={e => setAllocationAmounts(p => ({ ...p, [inv.id]: e.target.value }))}
                                placeholder="0.00"
                                className="w-32 ml-auto text-right font-medium"
                              />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                size="sm"
                                onClick={() => handleApplyToExisting(inv.id)}
                                disabled={allocatingPayment || !allocationAmounts[inv.id] || Number(allocationAmounts[inv.id]) <= 0}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                              >
                                {allocatingPayment ? <Loader2Icon className="h-4 w-4 animate-spin" /> : 'Apply'}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new" className="mt-0">
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <AddInvoiceClient 
              businessId={businessId} 
              paymentIdForAllocation={paymentId} 
              unallocatedAmount={unappliedBalance}
              prefillCustomerId={paymentDetails.customerId}
              projectId={paymentDetails.projectId} 
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
