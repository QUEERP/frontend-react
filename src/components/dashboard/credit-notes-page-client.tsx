import * as React from 'react'
import { Link } from 'react-router-dom';
import { creditNotesAPI, CreditNote } from '@/lib/api/credit-notes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Eye, FileText, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { getCurrencySymbol } from '@/lib/currencies'

interface CreditNotesPageClientProps {
  businessId: string
}

const statusClass = (status: string) => {
  if (status === 'OPEN') return 'bg-amber-100 text-amber-800'
  if (status === 'CLOSED') return 'bg-emerald-100 text-emerald-800'
  return 'bg-muted text-foreground'
}

const typeClass = (type: string) => {
  if (type === 'INVOICE') return 'bg-blue-100 text-blue-800'
  if (type === 'BILL') return 'bg-violet-100 text-violet-800'
  return 'bg-muted text-foreground'
}

export function CreditNotesPageClient({ businessId }: CreditNotesPageClientProps) {
  const [creditNotes, setCreditNotes] = React.useState<CreditNote[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null)

  const fetchCreditNotes = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await creditNotesAPI.getCreditNotes(businessId)
      setCreditNotes(response.data || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load credit notes')
      setCreditNotes([])
    } finally {
      setLoading(false)
    }
  }, [businessId])

  React.useEffect(() => {
    fetchCreditNotes()
  }, [fetchCreditNotes])

  const filtered = React.useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return creditNotes

    return creditNotes.filter((item) => {
      const customerName = item.customer?.name || item.customer?.company || ''
      const invoiceNumber = item.invoice?.invoiceNumber || ''
      return (
        item.creditNumber?.toLowerCase().includes(keyword) ||
        customerName.toLowerCase().includes(keyword) ||
        invoiceNumber.toLowerCase().includes(keyword) ||
        String(item.status || '').toLowerCase().includes(keyword)
      )
    })
  }, [creditNotes, search])

  const totals = React.useMemo(() => {
    return filtered.reduce(
      (acc, item) => {
        acc.amount += Number(item.amount || 0)
        acc.remaining += Number(item.remainingAmount || 0)
        return acc
      },
      { amount: 0, remaining: 0 },
    )
  }, [filtered])

  // Per-row amount formatter — uses the credit note's linked invoice currency
  const formatAmount = (value: number, currency?: string) => {
    const sym = currency ? getCurrencySymbol(currency) : ''
    return `${sym} ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleDownload = async (note: CreditNote) => {
    try {
      setDownloadingId(note.id)
      await creditNotesAPI.downloadCreditNotePdf(businessId, note)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to download credit note PDF')
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Clean Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Credit Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">Auto-generated from invoice and bill overpayments</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {[
          { label: 'Total Notes', value: filtered.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' },
          { label: 'Total Amount', value: totals.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }), icon: Download, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' },
          { label: 'Remaining Balance', value: totals.remaining.toLocaleString('en-US', { minimumFractionDigits: 2 }), icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800' },
        ].map(stat => (
          <Card key={stat.label} className="border-border bg-card shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`flex items-center justify-center h-12 w-12 rounded-xl border ${stat.bg} ${stat.color} shadow-sm shrink-0`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="w-full min-w-0 max-w-full rounded-2xl border-border bg-card shadow-sm overflow-hidden flex-1 flex flex-col">
        <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Credit Notes Directory</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {creditNotes.length} credit notes
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search credit notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl border-border bg-card w-full focus-visible:ring-blue-500 text-sm shadow-sm"
              />
            </div>
          </div>
        </CardHeader>
        <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-foreground">No credit notes found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">Credit notes are created automatically when overpayments happen.</p>
            </div>
          ) : (
            <Table className="w-full min-w-[850px]">
              <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                  <TableHead className="pl-6 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Credit #</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Party</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Invoice</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Remaining</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Created</TableHead>
                  <TableHead className="pr-6 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const party = item.customer?.name || item.customer?.company || item.invoice?.customer?.company || '-'
                  return (
                    <TableRow key={item.id} className="group hover:bg-muted/50 border-b border-border transition-colors">
                      <TableCell className="py-4">
                        <span className="font-bold text-sm text-blue-700 cursor-pointer hover:underline">
                          <Link to={`/dashboard/${businessId}/credit-notes/${item.id}`}>{item.creditNumber || item.id}</Link>
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className={typeClass(String(item.type || '')) + " text-[10px] uppercase font-bold tracking-wide"}>{String(item.type || '-')}</Badge>
                      </TableCell>
                      <TableCell className="py-4 font-semibold text-foreground text-sm">{party}</TableCell>
                      <TableCell className="py-4 text-sm font-medium text-muted-foreground">{item.invoice?.invoiceNumber || '-'}</TableCell>
                      <TableCell className="py-4">
                        <span className="font-bold text-sm text-foreground">{formatAmount(item.amount, (item as any).invoice?.currency || (item as any).currency)}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="font-bold text-sm text-foreground">{formatAmount(item.remainingAmount, (item as any).invoice?.currency || (item as any).currency)}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className={statusClass(String(item.status || '')) + " text-[10px] uppercase font-bold tracking-wide border-transparent"}>{String(item.status || '-')}</Badge>
                      </TableCell>
                      <TableCell className="py-4 text-sm font-medium text-muted-foreground">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button asChild variant="outline" size="sm" className="h-8 rounded-lg cursor-pointer border-border bg-card hover:bg-blue-50 hover:text-blue-600 text-muted-foreground font-medium shadow-sm">
                            <Link to={`/dashboard/${businessId}/credit-notes/${item.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg cursor-pointer border-border bg-card hover:bg-emerald-50 hover:text-emerald-600 text-muted-foreground font-medium shadow-sm"
                            onClick={() => void handleDownload(item)}
                            disabled={downloadingId === item.id}
                          >
                            {downloadingId === item.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1" />}
                            PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  )
}
