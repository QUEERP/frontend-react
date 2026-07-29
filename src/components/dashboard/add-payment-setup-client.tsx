import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBusinessData } from './business-data-provider'
import { ArrowLeftIcon } from 'lucide-react'

export function AddPaymentSetupClient({ businessId }: { businessId: string }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const customerId = searchParams.get('customerId')
  
  const { business } = useBusinessData()
  const isConstruction = business?.businessType?.toLowerCase() === 'construction'
  const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '')

  const [pendingDocs, setPendingDocs] = useState<any[]>([])
  const [selectedDocId, setSelectedDocId] = useState('')
  const [loading, setLoading] = useState(false)

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  useEffect(() => {
    if (!customerId) return
    const fetchPendingDocs = async () => {
      setLoading(true)
      try {
        const token = getCookie('token') || getCookie('accessToken')
        let endpoint = ''
        if (isConstruction) {
          endpoint = `${API_BASE}/api/quotations?customerId=${customerId}&status=ACCEPTED`
        } else {
          endpoint = `${API_BASE}/api/invoices?customerId=${customerId}&status=SENT,PARTIALLY_PAID`
        }
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId }
        })
        const data = await res.json()
        if (data.success) {
          setPendingDocs(isConstruction ? data.quotations : data.invoices)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPendingDocs()
  }, [customerId, businessId, isConstruction])

  const handleProceed = () => {
    if (isConstruction) {
      navigate(`/dashboard/${businessId}/payments/add?quotationId=${selectedDocId}`)
    } else {
      navigate(`/dashboard/${businessId}/invoices/payment?invoiceId=${selectedDocId}`)
    }
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-[#f8fafc] px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-slate-800">
            Add Payment
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">
            Select the {isConstruction ? 'project / quotation' : 'invoice'} you want to record a payment for.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="h-11 px-6 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm font-semibold"
        >
          <ArrowLeftIcon className="mr-2 h-5 w-5" />
          Back
        </Button>
      </div>
      
      <div className="max-w-xl mx-auto w-full mt-10">
        <Card className="rounded-2xl shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 rounded-t-2xl border-b border-slate-100 pb-6">
            <CardTitle className="text-xl">Select Document</CardTitle>
            <CardDescription className="text-sm">Choose from pending {isConstruction ? 'projects' : 'invoices'}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
             {loading ? <p className="text-sm text-muted-foreground flex items-center gap-2"><span className="animate-pulse h-4 w-4 bg-slate-200 rounded-full inline-block"></span> Loading...</p> : 
              pendingDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                No pending {isConstruction ? 'projects' : 'invoices'} found for this customer.
              </p>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select {isConstruction ? 'Project' : 'Invoice'}</label>
                <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                  <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 bg-white">
                    <SelectValue placeholder={`Select ${isConstruction ? 'Project' : 'Invoice'}`} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                    {pendingDocs.map((doc: any) => (
                      <SelectItem key={doc.id} value={doc.id} className="cursor-pointer focus:bg-slate-50">
                        <span className="font-medium text-slate-700">{isConstruction ? (doc.projectCode || doc.quoteNumber) : doc.invoiceNumber}</span>
                        <span className="text-slate-400 mx-2">—</span>
                        <span className="font-bold text-slate-900">{business?.currency || 'INR'} {Number(doc.grandTotal || doc.totalAmount || 0).toLocaleString()}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t border-slate-100 pt-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-700 rounded-xl">Cancel</Button>
            <Button disabled={!selectedDocId} onClick={handleProceed} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold px-8 h-11">Proceed to Payment</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
