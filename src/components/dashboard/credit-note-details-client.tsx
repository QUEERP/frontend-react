import * as React from 'react'
import {  useNavigate  } from 'react-router-dom';
import { creditNotesAPI, CreditNote } from '@/lib/api/credit-notes'
import { Badge } from '@/components/ui/badge'
import { getCurrencySymbol } from '@/lib/currencies'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CreditNoteDetailsClientProps {
  businessId: string
  creditNoteId: string
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

export function CreditNoteDetailsClient({ businessId, creditNoteId }: CreditNoteDetailsClientProps) {
  const navigate = useNavigate()
  const [note, setNote] = React.useState<CreditNote | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [downloading, setDownloading] = React.useState(false)

  React.useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true)
        const response = await creditNotesAPI.getCreditNoteById(businessId, creditNoteId)
        setNote(response.data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load credit note')
        setNote(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [businessId, creditNoteId])

  const handleDownload = async () => {
    if (!note) return

    try {
      setDownloading(true)
      await creditNotesAPI.downloadCreditNotePdf(businessId, note)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to download credit note PDF')
    } finally {
      setDownloading(false)
    }
  }

  const formatAmount = (value: number, currency?: string) => {
    const sym = currency ? getCurrencySymbol(currency) : ''
    return `${sym} ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground font-medium">Credit note not found.</p>
        <Button onClick={() => navigate(`/dashboard/${businessId}/credit-notes`)} className="rounded-xl bg-blue-600 hover:bg-blue-700">Back to Credit Notes</Button>
      </div>
    )
  }

  const party = note.customer?.name || note.customer?.company || note.invoice?.customer?.company || '-'

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/dashboard/${businessId}/credit-notes`)}
            className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex min-w-0 items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hidden sm:block">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-bold text-foreground tracking-tight">Credit Note {note.creditNumber || note.id}</span>
              <span className="text-sm font-medium text-muted-foreground mt-0.5">Detailed credit note information</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            onClick={() => void handleDownload()} 
            className="gap-2 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shadow-sm" 
            disabled={downloading}
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-border shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={typeClass(String(note.type || '')) + " text-xs uppercase font-bold tracking-wide"}>{String(note.type || '-')}</Badge>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className={statusClass(String(note.status || '')) + " text-xs uppercase font-bold tracking-wide border-transparent"}>{String(note.status || '-')}</Badge>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">
              {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden flex-1">
        <CardHeader className="border-b border-border bg-muted/50 p-6">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <FileText className="h-5 w-5 text-indigo-600" />
            Credit Note Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 p-6">
          <div className="space-y-1.5 rounded-xl border border-border bg-muted/50 p-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Party</div>
            <div className="text-base font-bold text-foreground">{party}</div>
          </div>
          <div className="space-y-1.5 rounded-xl border border-border bg-muted/50 p-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice #</div>
            <div className="text-base font-bold text-foreground">{note.invoice?.invoiceNumber || '-'}</div>
          </div>
          <div className="space-y-1.5 rounded-xl border border-border bg-muted/50 p-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Amount</div>
            <div className="text-base font-bold text-blue-700">{formatAmount(note.amount, note.invoice?.currency)}</div>
          </div>
          <div className="space-y-1.5 rounded-xl border border-border bg-muted/50 p-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remaining Amount</div>
            <div className="text-base font-bold text-emerald-600">{formatAmount(note.remainingAmount, note.invoice?.currency)}</div>
          </div>
          <div className="space-y-1.5 rounded-xl border border-border bg-muted/50 p-5 md:col-span-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</div>
            <div className="text-base font-medium text-foreground">{note.reason || 'No reason provided'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
