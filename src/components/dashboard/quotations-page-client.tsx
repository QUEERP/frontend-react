import * as React from 'react'
import {  useNavigate  } from 'react-router-dom';
import { quotationsAPI, Quotation } from '@/lib/api/quotations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      if (response.success) setQuotations(response.quotations || [])
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
    <div className="grid min-h-svh grid-cols-1 content-start gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-foreground">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            Quotations
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base font-medium">
            Create, manage, and track customer quotations and proposals.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportLoading || filteredQuotations.length === 0}
            className="h-11 px-6 rounded-xl cursor-pointer border-border bg-card hover:bg-muted text-foreground shadow-sm font-semibold flex-1 sm:flex-none"
          >
            {exportLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileDown className="mr-2 h-5 w-5" />}
            Export
          </Button>
          <Button
            onClick={() => navigate(`/dashboard/${businessId}/quotations/add`)}
            className="h-11 px-6 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold flex-1 sm:flex-none"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Quotation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden col-span-2 lg:col-span-1">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Quotes</p>
              <p className="text-2xl font-black text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hidden sm:block">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Approved</p>
              <p className="text-2xl font-black text-emerald-600">{stats.accepted}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl hidden sm:block">
              <Send className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Sent</p>
              <p className="text-2xl font-black text-blue-600">{stats.sent}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl hidden sm:block">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Rejected</p>
              <p className="text-2xl font-black text-rose-600">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-muted text-muted-foreground rounded-xl hidden sm:block">
              <Edit3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Draft</p>
              <p className="text-2xl font-black text-foreground">{stats.draft}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
        <CardHeader className="pb-4 border-b border-border bg-muted/50">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filter Quotations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search by quote number, title, or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-xl border-border bg-muted/50 focus:bg-card transition-colors"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[220px] h-11 rounded-xl border-border bg-card font-medium text-foreground cursor-pointer">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="all" className="rounded-lg cursor-pointer">All Statuses</SelectItem>
                <SelectItem value="Draft" className="rounded-lg cursor-pointer">Draft</SelectItem>
                <SelectItem value="Sent" className="rounded-lg cursor-pointer">Sent</SelectItem>
                <SelectItem value="Accepted" className="rounded-lg cursor-pointer">Accepted</SelectItem>
                <SelectItem value="Rejected" className="rounded-lg cursor-pointer">Rejected</SelectItem>
              </SelectContent>
            </Select>
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
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-muted-foreground">
          Showing <span className="text-foreground">{filteredQuotations.length}</span> of {quotations.length} quotations
        </p>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-muted-foreground">
            Updated: {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Quotations List */}
      <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
        <CardHeader className="pb-4 border-b border-border bg-muted/50">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Quotations Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredQuotations.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No quotations found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all'
                  ? "We couldn't find any quotations matching your current filters."
                  : "You haven't created any quotations yet. Create your first one to get started."}
              </p>
              {searchTerm || statusFilter !== 'all' ? (
                <Button
                  variant="outline"
                  onClick={() => { setSearchTerm(''); setStatusFilter('all') }}
                  className="rounded-xl font-semibold"
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(`/dashboard/${businessId}/quotations/add`)}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create Quotation
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-background border-border">
                    <TableHead className="font-semibold text-muted-foreground">Quote #</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Title</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Customer</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Total</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Issue Date</TableHead>
                    <TableHead className="text-right font-semibold text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow 
                      key={quotation.id} 
                      className={`border-border transition-colors ${business?.businessType?.toLowerCase() === 'basic' ? 'cursor-pointer hover:bg-muted/80' : 'hover:bg-muted/50'}`}
                      onClick={() => {
                        if (business?.businessType?.toLowerCase() === 'basic') {
                          navigate(`/dashboard/${businessId}/quotations/${quotation.id}/edit`)
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
                                    )}

                                    {isBasic && (quotation.status === 'APPROVED' || quotation.status === 'Approved') && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          navigate(`/dashboard/${businessId}/project-operations/projects/create?quotationId=${quotation.id}&customerId=${quotation.customerId || ''}`) 
                                        }}
                                        className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                      >
                                        <Plus className="mr-1 h-3.5 w-3.5" />
                                        Convert to Project
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
