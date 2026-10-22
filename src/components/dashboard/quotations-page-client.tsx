import * as React from 'react'
import {  useNavigate  } from 'react-router-dom';
import { quotationsAPI, Quotation } from '@/lib/api/quotations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileDown,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Send,
  Edit3,
  Banknote,
  Receipt,
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { exportToExcel } from '@/lib/export-utils'
import { getCookie } from '@/lib/utils'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

interface QuotationsPageClientProps {
  businessId: string
}

const STATUS_STYLE: Record<string, string> = {
  Draft: 'bg-muted text-foreground border-border',
  DRAFT: 'bg-muted text-foreground border-border',
  Sent: 'bg-blue-100 text-blue-800 border-blue-200',
  SENT: 'bg-blue-100 text-blue-800 border-blue-200',
  Accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ACCEPTED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
}

export function QuotationsPageClient({ businessId }: QuotationsPageClientProps) {
  const navigate = useNavigate()
  const [quotations, setQuotations] = React.useState<Quotation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [exportLoading, setExportLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const { business, role } = useBusinessData()
  const isBasic = business?.businessType?.toLowerCase() === 'basic'

  const isOwner = React.useMemo(() => {
    if (role?.name?.toLowerCase() === 'owner') return true;
    
    // Check if the user is the actual business creator/owner by decoding token
    const token = getCookie('token') || getCookie('accessToken');
    if (token) {
      try {
        const parts = token.split('.')
        if (parts.length >= 2) {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
          const decoded = JSON.parse(atob(padded))
          const userId = decoded.userId || decoded.id;
          if (userId && business?.ownerId && userId === business.ownerId) {
            return true;
          }
        }
      } catch (e) {
        // ignore decoding errors
      }
    }
    return false;
  }, [role, business])

  const fetchQuotations = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await quotationsAPI.getQuotations(businessId)
      if (response.success) {
        const standardQuotations = (response.quotations || []).filter(q => 
          !(q.quoteNumber?.startsWith('EST-') || q.quoteNumber?.startsWith('PRP-'))
        );
        setQuotations(standardQuotations);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch quotations')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  React.useEffect(() => {
    fetchQuotations()
  }, [fetchQuotations])

  const handleDelete = async (quotationId: string) => {
    try {
      const response = await quotationsAPI.deleteQuotation(businessId, quotationId)
      if (response.success) {
        toast.success('Quotation deleted successfully')
        fetchQuotations()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete quotation')
    }
  }

  const handleApprove = async (quotationId: string) => {
    try {
      await quotationsAPI.approveQuotation(businessId, quotationId)
      toast.success('Quotation approved successfully')
      fetchQuotations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve quotation')
    }
  }

  const handleReject = async (quotationId: string) => {
    try {
      await quotationsAPI.rejectQuotation(businessId, quotationId)
      toast.success('Quotation rejected successfully')
      fetchQuotations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject quotation')
    }
  }

  const handleDownloadPdf = async (quotationId: string, quoteNumber: string) => {
    try {
      toast.info('Generating PDF...')
      await quotationsAPI.downloadQuotationPdf(businessId, quotationId, quoteNumber)
      toast.success('Quotation PDF downloaded successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download PDF')
    }
  }

  const formatCurrency = (value: number, currency: string = 'INR') =>
    new Intl.NumberFormat(currency === 'CAD' ? 'en-CA' : 'en-IN', { style: 'currency', currency }).format(value)

  const handleExport = () => {
    try {
      setExportLoading(true)
      const exportData = filteredQuotations.map((q) => ({
        'Quote Number': q.quoteNumber,
        'Title': q.title || '',
        'Customer': q.customer?.company || q.customer?.name || q.customer?.email || '',
        'Status': q.status,
        'Total Amount': q.totalAmount,
        'Issue Date': new Date(q.issueDate).toLocaleDateString(),
        'Expiry Date': q.expiryDate ? new Date(q.expiryDate).toLocaleDateString() : ''
      }))

      exportToExcel(exportData, `Quotations_Report_${new Date().toISOString().split('T')[0]}`, 'Quotations')
      toast.success('Quotation report downloaded')
    } catch (error) {
      toast.error('Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  const filteredQuotations = quotations.filter(q => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      q.quoteNumber.toLowerCase().includes(searchLower) ||
      (q.title && q.title.toLowerCase().includes(searchLower)) ||
      (q.customer?.company && q.customer.company.toLowerCase().includes(searchLower)) ||
      (q.customer?.name && q.customer.name.toLowerCase().includes(searchLower)) ||
      (q.customer?.email && q.customer.email.toLowerCase().includes(searchLower))

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: quotations.length,
    accepted: quotations.filter(q => ['Accepted', 'ACCEPTED', 'Approved', 'APPROVED'].includes(q.status)).length,
    rejected: quotations.filter(q => ['Rejected', 'REJECTED'].includes(q.status)).length,
    sent: quotations.filter(q => ['Sent', 'SENT'].includes(q.status)).length,
    draft: quotations.filter(q => ['Draft', 'DRAFT'].includes(q.status)).length,
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Clean Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Quotations</h1>
          <p className="text-sm text-muted-foreground mt-1">Create, manage, and track customer quotations and proposals</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportLoading || filteredQuotations.length === 0}
            className="h-10 gap-2 bg-card hover:bg-muted text-foreground border-border shadow-sm rounded-xl font-medium px-4 cursor-pointer"
          >
            {exportLoading ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <FileDown className="h-4 w-4" />}
            Export CSV
          </Button>
          <Button
            onClick={() => navigate(`/dashboard/${businessId}/quotations/add`)}
            className="h-10 cursor-pointer gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-xl border-none font-medium px-5"
          >
            <Plus className="h-4 w-4" />
            New Quotation
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total Quotes', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' },
          { label: 'Approved', value: stats.accepted, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' },
          { label: 'Sent', value: stats.sent, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800' },
          { label: 'Draft', value: stats.draft, icon: Edit3, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-700' },
        ].map(stat => (
          <Card key={stat.label} className="border-border bg-card shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`flex items-center justify-center h-12 w-12 rounded-xl border ${stat.bg} ${stat.color} shadow-sm`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Unified Quotations Directory Card */}
      <Card className="w-full min-w-0 max-w-full rounded-2xl border-border bg-card shadow-sm overflow-hidden flex flex-col">
        <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Quotations Directory</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                Showing <span className="text-foreground font-semibold">{filteredQuotations.length}</span> of {quotations.length} quotations
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search quote #, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-9 rounded-xl border-border bg-card focus-visible:ring-blue-500 h-10 text-sm shadow-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-10 rounded-xl border-border bg-card font-medium text-foreground text-sm cursor-pointer shadow-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="all" className="rounded-lg cursor-pointer">All Statuses</SelectItem>
                  <SelectItem value="Draft" className="rounded-lg cursor-pointer">Draft</SelectItem>
                  {!isBasic && <SelectItem value="Sent" className="rounded-lg cursor-pointer">Sent</SelectItem>}
                  {!isBasic && <SelectItem value="Accepted" className="rounded-lg cursor-pointer">Accepted</SelectItem>}
                  {isBasic && <SelectItem value="APPROVED" className="rounded-lg cursor-pointer">Approved</SelectItem>}
                  <SelectItem value="Rejected" className="rounded-lg cursor-pointer">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || statusFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
              {searchTerm && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-none rounded-lg text-xs font-semibold">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5 cursor-pointer transition-colors"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none rounded-lg text-xs font-semibold">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:bg-indigo-200 rounded-full p-0.5 cursor-pointer transition-colors"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {filteredQuotations.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No quotations found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                {searchTerm || statusFilter !== 'all'
                  ? "We couldn't find any quotations matching your current filters."
                  : "You haven't created any quotations yet. Create your first one to get started."}
              </p>
              {searchTerm || statusFilter !== 'all' ? (
                <Button
                  variant="outline"
                  onClick={() => { setSearchTerm(''); setStatusFilter('all') }}
                  className="rounded-xl font-medium"
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(`/dashboard/${businessId}/quotations/add`)}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quotation
                </Button>
              )}
            </div>
          ) : (
            <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
              <Table className="w-full min-w-[850px]">
                <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                  <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                    <TableHead className="pl-6 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Quote #</TableHead>
                    <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Title</TableHead>
                    <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                    <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total</TableHead>
                    <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Issue Date</TableHead>
                    <TableHead className="pr-6 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow 
                      key={quotation.id} 
                      className="cursor-pointer border-border transition-colors hover:bg-muted/80"
                      onClick={() => {
                        if (business?.businessType?.toLowerCase() === 'basic') {
                          navigate(`/dashboard/${businessId}/quotations/${quotation.id}/edit`)
                        } else {
                          navigate(`/dashboard/${businessId}/quotations/${quotation.id}`)
                        }
                      }}
                    >
                      <TableCell className="font-semibold text-foreground">{quotation.quoteNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{quotation.title || '—'}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {quotation.customer?.company || quotation.customer?.name || quotation.customer?.email || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2.5 py-1 rounded-lg border font-semibold flex w-fit items-center gap-1.5 ${STATUS_STYLE[quotation.status] || 'bg-muted text-foreground border-border'}`}>
                          {quotation.status === 'APPROVED' || quotation.status === 'ACCEPTED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                          {quotation.status === 'REJECTED' ? <XCircle className="w-3.5 h-3.5" /> : null}
                          {quotation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">{formatCurrency(quotation.totalAmount, quotation.currency)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-medium">
                        {new Date(quotation.issueDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2">
                                  {isOwner && ['DRAFT', 'Draft', 'SENT', 'Sent'].includes(quotation.status) && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => { e.stopPropagation(); handleApprove(quotation.id) }}
                                        className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                      >
                                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => { e.stopPropagation(); handleReject(quotation.id) }}
                                        className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                      >
                                        <XCircle className="mr-1 h-3.5 w-3.5" />
                                        Reject
                                      </Button>
                                    </>
                                  )}

                                    {(quotation.status === 'APPROVED' || quotation.status === 'Approved') && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          if (isBasic) {
                                            navigate(`/dashboard/${businessId}/project-operations/projects/create?quotationId=${quotation.id}&customerId=${quotation.customerId || ''}`) 
                                          } else {
                                            navigate(`/dashboard/${businessId}/sales-orders/add?quotationId=${quotation.id}`)
                                          }
                                        }}
                                        className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                      >
                                        <Plus className="mr-1 h-3.5 w-3.5" />
                                        {isBasic ? 'Convert to Project' : 'Convert to Sales Order'}
                                      </Button>
                                    )}

                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-muted">
                                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40 rounded-xl border-border shadow-lg" onClick={(e) => e.stopPropagation()}>
                                      <DropdownMenuItem
                                        onSelect={() => navigate(`/dashboard/${businessId}/quotations/${quotation.id}`)}
                                        className="rounded-lg cursor-pointer font-medium text-foreground focus:bg-muted focus:text-foreground"
                                      >
                                        <FileText className="mr-2 h-4 w-4" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onSelect={() =>
                                          navigate(`/dashboard/${businessId}/quotations/${quotation.id}/edit`)
                                        }
                                        className="rounded-lg cursor-pointer font-medium text-foreground focus:bg-muted focus:text-foreground"
                                      >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit Quote
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onSelect={() => handleDownloadPdf(quotation.id, quotation.quoteNumber)}
                                        className="rounded-lg cursor-pointer font-medium text-slate-700 focus:bg-slate-50 focus:text-slate-800"
                                      >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download PDF
                                      </DropdownMenuItem>
                                      <div className="h-px bg-muted my-1" />
                                      <DropdownMenuItem
                                        onSelect={() => handleDelete(quotation.id)}
                                        className="rounded-lg cursor-pointer font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                        </div>
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
  )
}
