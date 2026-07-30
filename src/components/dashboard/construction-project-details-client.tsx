import * as React from 'react'
import {  useNavigate  } from 'react-router-dom';
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Clock,
  Loader2,
  Building2,
  Calendar,
  AlertCircle,
  Banknote,
  Receipt
} from 'lucide-react'
import { toast } from 'sonner'
import { getCookie } from '@/lib/utils'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

interface ConstructionProjectDetailsClientProps {
  businessId: string
  projectId: string
}

export function ConstructionProjectDetailsClient({ businessId, projectId }: ConstructionProjectDetailsClientProps) {
  const navigate = useNavigate()
  const [project, setProject] = React.useState<any>(null)
  const [quotation, setQuotation] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const { business } = useBusinessData()

  const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '')

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)
      const token = getCookie('token') || getCookie('accessToken')
      const headers = { Authorization: `Bearer ${token}`, 'x-business-id': businessId }

      // Fetch Project
      const projRes = await fetch(`${API_BASE}/api/projects/${projectId}`, { headers })
      const projData = await projRes.json()
      
      if (projData.success && projData.project) {
        setProject(projData.project)
        
        // If project has a quotation, fetch it to get the line items
        if (projData.project.quotationId) {
          const quotRes = await fetch(`${API_BASE}/api/quotation/${projData.project.quotationId}`, { headers })
          const quotData = await quotRes.json()
          if (quotData.success) {
            // The quotation api returns result.data or result.quotation usually.
            // Let's handle it robustly
            setQuotation(quotData.quotation || quotData.data)
          }
        }
      } else {
        toast.error('Failed to fetch project details')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch details')
    } finally {
      setLoading(false)
    }
  }, [businessId, projectId, API_BASE])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center p-6 text-muted-foreground">
        <AlertCircle className="h-10 w-10 mb-4 text-slate-400" />
        <p className="text-lg font-semibold text-foreground">Project Not Found</p>
        <p className="text-sm">The project you are looking for does not exist.</p>
        <Button variant="outline" className="mt-6 rounded-xl" onClick={() => navigate(`/dashboard/${businessId}/project-operations/projects`)}>
          Return to Projects
        </Button>
      </div>
    )
  }

  const formatCurrency = (v: number) => {
    const c = quotation?.currency || project.currency || 'CAD';
    return new Intl.NumberFormat(c === 'CAD' ? 'en-CA' : 'en-IN', { style: 'currency', currency: c }).format(Number(v || 0));
  }

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* ── Action Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm w-full">
        <div className="flex items-start md:items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/dashboard/${businessId}/project-operations/projects`)}
            className="rounded-full h-10 w-10 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Project #{project.projectCode}
              </h1>
              <Badge variant="outline" className="w-fit text-sm font-semibold rounded-full bg-blue-50 text-blue-700 border-blue-200 px-3 py-0.5">
                {project.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 font-medium mt-1">
              {project.projectName}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          <Button
            onClick={() => navigate(project.quotationId ? `/dashboard/${businessId}/payments/add?quotationId=${project.quotationId}&projectId=${project.id}` : `#`)}
            className="h-10 rounded-xl cursor-pointer gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm w-full md:w-auto"
          >
            <Banknote className="h-4 w-4" />
            Add Payment
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/${businessId}/invoices/add?projectId=${project.id}`)}
            className="h-10 rounded-xl cursor-pointer gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold bg-card w-full md:w-auto"
          >
            <Receipt className="h-4 w-4" />
            Add Invoice
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/${businessId}/expenses/add?projectId=${project.id}`)}
            className="h-10 rounded-xl cursor-pointer gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 font-semibold bg-card w-full md:w-auto"
          >
            <Receipt className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column: Main Document ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 overflow-hidden relative">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-gray-700 p-8">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-6">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">{business?.name || 'Business'}</h2>
                  <p className="text-sm text-gray-500 mt-1 max-w-[200px] leading-relaxed">{business?.address || 'No address provided'}</p>
                </div>
                <div className="text-left sm:text-right">
                  <h3 className="text-3xl font-black text-gray-200 dark:text-gray-800 uppercase tracking-widest mb-2">PROJECT</h3>
                  <div className="flex items-center sm:justify-end gap-2 text-sm text-gray-500 font-medium">
                    <span>{project.projectCode}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-6 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Building2 className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Billed To</h4>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{project.customer?.company || project.customer?.name}</p>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      {project.customer?.email && <span className="block">{project.customer.email}</span>}
                      {project.customer?.phone && <span className="block">{project.customer.phone}</span>}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Project Dates</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Start Date</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">End Date</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500 font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Item Details</th>
                        <th className="px-6 py-4 text-right">Qty</th>
                        <th className="px-6 py-4 text-right">Rate</th>
                        <th className="px-6 py-4 text-right">Tax %</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-800">
                      {quotation?.items?.length > 0 ? quotation.items.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900 dark:text-white">{item.itemName}</p>
                            {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                          </td>
                          <td className="px-6 py-4 text-right font-medium">{item.quantity}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.price || item.unitPrice || item.rate || 0)}</td>
                          <td className="px-6 py-4 text-right font-medium">{item.taxPercent || item.taxRate || 0}%</td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(item.total || item.amount || 0)}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No line items found for this project.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              {quotation && (
                <div className="flex justify-end pt-4">
                  <div className="w-full sm:w-1/2 lg:w-1/3 space-y-3">
                    <div className="flex justify-between text-sm font-medium text-gray-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(quotation.subtotal || quotation.subTotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-gray-500">
                      <span>Total Tax</span>
                      <span>{formatCurrency(quotation.tax || quotation.taxTotal || 0)}</span>
                    </div>
                    {quotation.discount > 0 && (
                      <div className="flex justify-between text-sm font-medium text-rose-500">
                        <span>Discount</span>
                        <span>-{formatCurrency(quotation.discount)}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <span className="font-bold text-gray-900 dark:text-white">Total Budget</span>
                      <span className="text-xl font-black text-blue-600">{formatCurrency(quotation.totalAmount || quotation.total || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
              {!quotation && (
                <div className="flex justify-end pt-4">
                  <div className="w-full sm:w-1/2 lg:w-1/3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span className="font-bold text-gray-900 dark:text-white">Total Budget</span>
                    <span className="text-xl font-black text-blue-600">{formatCurrency(project.budget || 0)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Statement Section */}
          <Card className="rounded-2xl border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 overflow-hidden relative mt-6">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-gray-700 p-6">
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-600" />
                Financial Statement
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Payments List */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Payments Received</h4>
                  {(!quotation?.payments || quotation.payments.length === 0) ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-center border border-dashed border-gray-200 dark:border-gray-700">
                      No payments recorded yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {quotation.payments.map((p: any, i: number) => (
                        <div key={p.id || i} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{p.paymentMode || 'Payment'}</span>
                            <span className="text-xs text-gray-500">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'No date'}</span>
                          </div>
                          <span className="text-sm font-bold text-emerald-600">
                            {formatCurrency(p.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expenses List */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Expenses Incurred</h4>
                  {(!project.expenses || project.expenses.length === 0) ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-center border border-dashed border-gray-200 dark:border-gray-700">
                      No expenses recorded yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {project.expenses.map((e: any, i: number) => (
                        <div key={e.id || i} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{e.title || e.category || 'Expense'}</span>
                            <span className="text-xs text-gray-500">{e.date ? new Date(e.date).toLocaleDateString() : 'No date'}</span>
                          </div>
                          <span className="text-sm font-bold text-rose-600 shrink-0">
                            {formatCurrency(e.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invoices List */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Invoices Created</h4>
                  {(!project.invoices || project.invoices.length === 0) ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-center border border-dashed border-gray-200 dark:border-gray-700">
                      No invoices created yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {project.invoices.map((inv: any, i: number) => (
                        <div key={inv.id || i} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/invoices/${inv.id}`)}>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{inv.invoiceNumber || 'Invoice'}</span>
                            <span className="text-xs text-gray-500">{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : 'No date'}</span>
                          </div>
                          <span className="text-sm font-bold text-blue-600 shrink-0">
                            {formatCurrency(inv.totalAmount || inv.total || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Sidebar Meta ── */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50">
              <CardTitle className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Department</span>
                <span className="font-bold text-gray-900 dark:text-white text-base">{project.department || 'Construction'}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Execution Type</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{project.executionType || 'CONSTRUCTION'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Progress</span>
                  <span className="font-semibold text-blue-600">{project.completionPercentage || 0}%</span>
                </div>
              </div>
              {project.quotationId && (
                <div className="flex flex-col gap-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Generated From Quotation</span>
                  <span className="font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/dashboard/${businessId}/quotations/${project.quotationId}`)}>
                    View Quotation
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
