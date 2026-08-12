import { toast } from 'sonner';
import * as React from 'react'
import { Link } from 'react-router-dom';
import {  useLocation  } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { JournalEntry, getJournalEntry } from '@/lib/api/journal-entries'

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([\\^$|?*+()[\]{}.])/g, '\\$1') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : ''
}

export default function JournalEntryDetailsClient({ entryId }: { entryId: string }) {
  const pathname = useLocation().pathname
  const { toast } = useToast()

  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
  const token = React.useMemo(() => getCookie('token') || getCookie('accessToken'), [])

  const [isLoading, setIsLoading] = React.useState(true)
  const [entry, setEntry] = React.useState<JournalEntry | null>(null)

  React.useEffect(() => {
    const loadEntry = async () => {
      if (!token || !businessId || !entryId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const row = await getJournalEntry(token, businessId, entryId)
        setEntry(row)
      } catch (error) {
        toast({
          title: 'Failed to load entry',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadEntry()
  }, [businessId, entryId, token])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="space-y-6 p-6">
        <Link to={`/dashboard/${businessId}/journal-entries`}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Journal Entries
          </Button>
        </Link>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Entry not found.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <Link to={`/dashboard/${businessId}/journal-entries`}>
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Journal Entries
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Journal Entry Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">{new Date(entry.date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Account</p>
            <p className="font-medium">{entry.account?.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Debit</p>
            <p className="font-medium">{Number(entry.debit || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Credit</p>
            <p className="font-medium">{Number(entry.credit || 0).toFixed(2)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="font-medium">{entry.description || '-'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
