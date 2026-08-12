import * as React from 'react'
import { Link } from 'react-router-dom';
import {  useLocation, useNavigate  } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2, Info, Calendar, AlignLeft, Calculator, AlertCircle, CheckCircle2, Wallet, BookOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getAccounts } from '@/lib/api/accounts'
import { createJournalEntry } from '@/lib/api/journal-entries'

type EntryLine = {
  accountId: string
  debit: number
  credit: number
}

type AccountOption = {
  id: string
  name: string
  code?: string | null
  type: string
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([\\^$|?*+()[\]{}.])/g, '\\$1') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : ''
}

function normalizeAmount(value: number | string | undefined): number {
  const numeric = Number(value || 0)
  return Number(numeric.toFixed(2))
}

export default function JournalEntryForm() {
  const navigate = useNavigate()
  const pathname = useLocation().pathname


  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''

  const getAuthToken = React.useCallback(() => {
    return getCookie('token') || getCookie('accessToken')
  }, [])

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoadingAccounts, setIsLoadingAccounts] = React.useState(true)
  const [accounts, setAccounts] = React.useState<AccountOption[]>([])

  const [description, setDescription] = React.useState('')
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0])
  const [lines, setLines] = React.useState<EntryLine[]>([
    { accountId: '', debit: 0, credit: 0 },
    { accountId: '', debit: 0, credit: 0 },
  ])

  React.useEffect(() => {
    const loadAccounts = async () => {
      const token = getAuthToken()

      if (!token || !businessId) {
        setIsLoadingAccounts(false)
        return
      }

      try {
        setIsLoadingAccounts(true)
        const rows = await getAccounts(token, businessId)
        setAccounts(
          rows.map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
            type: item.type,
          }))
        )
      } catch (error) {
        toast.error('Failed to load accounts', {
          description: error instanceof Error ? error.message : 'Please try again.',
        })
      } finally {
        setIsLoadingAccounts(false)
      }
    }

    loadAccounts()
  }, [businessId, getAuthToken])

  const totals = React.useMemo(() => {
    return lines.reduce(
      (sum, line) => {
        sum.debit = normalizeAmount(sum.debit + normalizeAmount(line.debit))
        sum.credit = normalizeAmount(sum.credit + normalizeAmount(line.credit))
        return sum
      },
      { debit: 0, credit: 0 }
    )
  }, [lines])

  const addLine = () => {
    setLines((prev) => [...prev, { accountId: '', debit: 0, credit: 0 }])
  }

  const removeLine = (index: number) => {
    if (lines.length <= 2) return
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  const updateLine = (index: number, key: keyof EntryLine, value: string | number) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line
        if (key === 'accountId') {
          return { ...line, accountId: String(value) }
        }

        const amount = Number(value || 0)
        if (key === 'debit') {
          return { ...line, debit: normalizeAmount(amount), credit: amount > 0 ? 0 : line.credit }
        }

        if (key === 'credit') {
          return { ...line, credit: normalizeAmount(amount), debit: amount > 0 ? 0 : line.debit }
        }

        return line
      })
    )
  }

  const validateBeforeSubmit = (token: string) => {
    if (!token || !businessId) {
      toast.error('Missing context', {
        description: 'Authentication or business context is missing.',
      })
      return false
    }

    if (isLoadingAccounts) {
      toast.error('Accounts still loading', {
        description: 'Please wait until account options finish loading.',
      })
      return false
    }

    if (accounts.length === 0) {
      toast.error('No accounts available', {
        description: 'Create accounts first before posting a journal entry.',
      })
      return false
    }

    if (lines.length < 2) {
      toast.error('Validation error', {
        description: 'At least 2 entry lines are required.',
      })
      return false
    }

    for (const [index, line] of lines.entries()) {
      if (!line.accountId) {
        toast.error('Validation error', {
          description: `Account is required on line ${index + 1}.`,
        })
        return false
      }

      const hasDebit = normalizeAmount(line.debit) > 0
      const hasCredit = normalizeAmount(line.credit) > 0

      if (hasDebit && hasCredit) {
        toast.error('Validation error', {
          description: `Use either debit or credit on line ${index + 1}, not both.`,
        })
        return false
      }

      if (!hasDebit && !hasCredit) {
        toast.error('Validation error', {
          description: `Enter debit or credit on line ${index + 1}.`,
        })
        return false
      }
    }

    // Backend currently validates accounts using unique findMany length, so duplicate
    // account rows in one payload are rejected as "Invalid account(s)".
    const usedAccountIds = lines.map((line) => line.accountId)
    const uniqueAccountIds = new Set(usedAccountIds)
    if (uniqueAccountIds.size !== usedAccountIds.length) {
      toast.error('Validation error', {
        description: 'Each line must use a different account. Duplicate accounts are not allowed in one entry.',
      })
      return false
    }

    if (normalizeAmount(totals.debit) !== normalizeAmount(totals.credit)) {
      toast.error('Validation error', {
        description: 'Debit and credit totals must be equal.',
      })
      return false
    }

    return true
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const token = getAuthToken()

    if (!token || !businessId) {
      toast.error('Missing context', {
        description: 'Authentication or business context is missing.',
      })
      return
    }

    if (!validateBeforeSubmit(token)) return

    try {
      setIsSubmitting(true)
      await createJournalEntry(token, businessId, {
        entries: lines.map((line) => ({
          accountId: line.accountId,
          debit: normalizeAmount(line.debit),
          credit: normalizeAmount(line.credit),
        })),
        description: description.trim() || undefined,
        date: date || undefined,
      })

      toast.success('Journal entry created', {
        description: 'Entry posted successfully.',
      })

      navigate(`/dashboard/${businessId}/journal-entries`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.'
      const normalized = message.toLowerCase()

      let description = message
      if (normalized.includes('invalid account')) {
        description = 'One or more selected accounts are invalid for this business. Also avoid using the same account on multiple lines.'
      } else if (normalized.includes('debit and credit must be equal')) {
        description = 'Debit and credit totals must match exactly before posting.'
      }

      toast.error('Create failed', {
        description,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-muted/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-xl h-10 w-10 border-border dark:border-slate-800 bg-card dark:bg-slate-900 hover:bg-muted dark:hover:bg-slate-800 transition-colors shadow-sm">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Create Journal Entry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add balanced debit and credit lines to your ledger
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
        {/* Entry Information */}
        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4 bg-muted/50 dark:bg-slate-900/50">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Info className="h-5 w-5 text-blue-500" />
              General Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
            {accounts.length === 0 && !isLoadingAccounts ? (
              <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-900/50 p-4 text-sm text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <strong className="font-semibold block">No active accounts found</strong>
                    <span>You must create accounts before posting a journal entry.</span>
                  </div>
                </div>
                <Link to={`/dashboard/${businessId}/accounts/add`}>
                  <Button type="button" variant="outline" className="rounded-xl bg-card dark:bg-slate-900 border-amber-200 dark:border-amber-800">
                    Create Account
                  </Button>
                </Link>
              </div>
            ) : null}

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                <AlignLeft className="h-3.5 w-3.5" /> Description
              </label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Briefly describe the purpose of this journal entry..."
                className="rounded-xl resize-none transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Date *
              </label>
              <div className="relative">
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(event) => setDate(event.target.value)} 
                  className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entry Lines */}
        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between gap-4 bg-muted/50 dark:bg-slate-900/50">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="h-5 w-5 text-emerald-500" />
              Line Items
            </CardTitle>
            <Button type="button" variant="outline" size="sm" className="gap-2 rounded-xl h-9 bg-card dark:bg-slate-900" onClick={addLine}>
              <Plus className="h-4 w-4" />
              Add Line
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 space-y-4">
              {lines.map((line, index) => (
                <div key={index} className="grid gap-3 sm:grid-cols-[2fr,1fr,1fr,auto] items-start p-4 rounded-2xl bg-muted/50 dark:bg-slate-900/50 border border-border dark:border-slate-800">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5" /> Account *
                    </label>
                    <Select
                      value={line.accountId}
                      onValueChange={(value) => updateLine(index, 'accountId', value)}
                      disabled={isLoadingAccounts}
                    >
                      <SelectTrigger className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 h-10">
                        <SelectValue placeholder={isLoadingAccounts ? 'Loading accounts...' : 'Select account'} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id} className="rounded-lg">
                            {account.name}
                            {account.code ? ` (${account.code})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Debit</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 h-10"
                      value={line.debit || ''}
                      onChange={(event) => updateLine(index, 'debit', event.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Credit</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 h-10"
                      value={line.credit || ''}
                      onChange={(event) => updateLine(index, 'credit', event.target.value)}
                    />
                  </div>

                  <div className="flex items-end pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-10 w-10 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 text-muted-foreground"
                      disabled={lines.length <= 2}
                      onClick={() => removeLine(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-muted dark:bg-slate-900 border-t border-border dark:border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground">
                <Calculator className="h-4 w-4" /> 
                Totals Summary
              </div>
              <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                <div className={`rounded-xl p-4 border flex items-center justify-between ${
                  normalizeAmount(totals.debit) === normalizeAmount(totals.credit) && totals.debit > 0
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20'
                    : 'border-border bg-card dark:border-slate-800 dark:bg-slate-950'
                }`}>
                  <span className="text-sm font-medium text-muted-foreground">Total Debit</span>
                  <span className="text-xl font-bold tracking-tight">{totals.debit.toFixed(2)}</span>
                </div>
                <div className={`rounded-xl p-4 border flex items-center justify-between ${
                  normalizeAmount(totals.debit) === normalizeAmount(totals.credit) && totals.credit > 0
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20'
                    : 'border-border bg-card dark:border-slate-800 dark:bg-slate-950'
                }`}>
                  <span className="text-sm font-medium text-muted-foreground">Total Credit</span>
                  <span className="text-xl font-bold tracking-tight">{totals.credit.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-sm">
            {normalizeAmount(totals.debit) !== normalizeAmount(totals.credit) ? (
              <div className="flex items-center gap-2 text-red-500 font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/50">
                <AlertCircle className="h-4 w-4" />
                Cannot post: Debit and Credit must match exactly.
              </div>
            ) : totals.debit > 0 && totals.credit > 0 ? (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                <CheckCircle2 className="h-4 w-4" />
                Entry is balanced and ready to post.
              </div>
            ) : null}
          </div>
          
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="rounded-xl h-11 px-6 border-border dark:border-slate-800 bg-card dark:bg-slate-950" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoadingAccounts || normalizeAmount(totals.debit) !== normalizeAmount(totals.credit) || totals.debit === 0} 
              className="gap-2 rounded-xl h-11 px-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm transition-all hover:shadow-md"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Posting...' : isLoadingAccounts ? 'Loading...' : 'Post Entry'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
