import { toast } from 'sonner';
import * as React from 'react'
import { Link } from 'react-router-dom';
import {  useLocation  } from 'react-router-dom';
import { MoreVertical, Plus, Search, BookOpen, TrendingDown, TrendingUp, Trash2, Eye, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { deleteJournalEntry, JournalEntry, listJournalEntries } from '@/lib/api/journal-entries'

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([\\^$|?*+()[\]{}.])/g, '\\$1') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : ''
}

export default function JournalEntriesPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()

  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''

  const [entries, setEntries] = React.useState<JournalEntry[]>([])
  const [filteredEntries, setFilteredEntries] = React.useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedEntry, setSelectedEntry] = React.useState<JournalEntry | null>(null)

  const token = React.useMemo(() => getCookie('token') || getCookie('accessToken'), [])

  const loadEntries = React.useCallback(async () => {
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to load journal entries.',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    if (!businessId) {
      toast({
        title: 'Business required',
        description: 'Business context was not found.',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const rows = await listJournalEntries(token, businessId)
      setEntries(rows)
    } catch (error) {
      toast({
        title: 'Failed to load entries',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [businessId, toast, token])

  React.useEffect(() => {
    loadEntries()
  }, [loadEntries])

  React.useEffect(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) {
      setFilteredEntries(entries)
      return
    }

    setFilteredEntries(
      entries.filter((entry) =>
        [
          entry.account?.name || '',
          entry.account?.code || '',
          entry.description || '',
          entry.debit.toString(),
          entry.credit.toString(),
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      )
    )
  }, [entries, searchTerm])

  const handleDelete = async () => {
    if (!token || !businessId || !selectedEntry) return

    try {
      await deleteJournalEntry(token, businessId, selectedEntry.id)
      setEntries((prev) => prev.filter((item) => item.id !== selectedEntry.id))
      toast({
        title: 'Entry deleted',
        description: 'Journal entry was deleted successfully.',
      })
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedEntry(null)
    }
  }

  const totals = React.useMemo(() => {
    return filteredEntries.reduce(
      (sum, item) => {
        sum.debit += Number(item.debit || 0)
        sum.credit += Number(item.credit || 0)
        return sum
      },
      { debit: 0, credit: 0 }
    )
  }, [filteredEntries])

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[400px] items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground">Loading journal entries...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-muted/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Journal Entries
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage your debit and credit postings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/dashboard/${businessId}/journal-entries/add`}>
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <Plus className="h-4 w-4" />
              New Journal Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Debit</p>
                <p className="text-3xl font-bold tracking-tight">{totals.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                <TrendingDown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Credit</p>
                <p className="text-3xl font-bold tracking-tight">{totals.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col flex-1">
        <CardHeader className="border-b border-border/50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/50 dark:bg-slate-900/50">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Journal Records
            </CardTitle>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-10 rounded-xl bg-card dark:bg-slate-950 border-border dark:border-slate-800 transition-all focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search accounts, codes, descriptions..."
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted dark:bg-slate-800 mb-4">
                <BookOpen className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground dark:text-slate-100">No entries found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {searchTerm ? "No journal entries match your search criteria." : "You haven't recorded any journal entries yet. Click 'New Journal Entry' to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader className="bg-muted/80 dark:bg-slate-900/80">
                  <TableRow className="border-b border-border dark:border-slate-800">
                    <TableHead className="font-semibold h-11">Date</TableHead>
                    <TableHead className="font-semibold h-11">Account</TableHead>
                    <TableHead className="font-semibold h-11 hidden sm:table-cell">Code</TableHead>
                    <TableHead className="font-semibold h-11 hidden md:table-cell">Description</TableHead>
                    <TableHead className="text-right font-semibold h-11">Debit</TableHead>
                    <TableHead className="text-right font-semibold h-11">Credit</TableHead>
                    <TableHead className="w-20 font-semibold h-11 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id} className="border-b border-border dark:border-slate-800/60 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="text-sm font-medium whitespace-nowrap text-foreground dark:text-slate-300">
                        {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground dark:text-slate-100">{entry.account?.name || '-'}</span>
                          <span className="text-xs text-muted-foreground sm:hidden mt-0.5">{entry.account?.code}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm hidden sm:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground dark:bg-slate-800 dark:text-slate-300 border border-border dark:border-slate-700">
                          {entry.account?.code || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm hidden md:table-cell text-muted-foreground truncate max-w-[250px]">
                        {entry.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(entry.debit) > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {Number(entry.debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(entry.credit) > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {Number(entry.credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-blue-50 focus:text-blue-600 dark:focus:bg-blue-900/30 dark:focus:text-blue-400">
                              <Link to={`/dashboard/${businessId}/journal-entries/${entry.id}`} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-500 dark:focus:bg-red-900/30 dark:focus:text-red-400 mt-1"
                              onClick={() => {
                                setSelectedEntry(entry)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-500 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Journal Entry
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Are you sure you want to delete this journal entry? This action cannot be undone and will permanently remove this record from your books.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-red-600 hover:bg-red-700 gap-2" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
