import { toast } from 'sonner';
import * as React from 'react'
import {  useLocation, useNavigate  } from 'react-router-dom';
import { ArrowLeft, Save, Info, Loader2, Building2 } from 'lucide-react'

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
import { useToast } from '@/components/ui/use-toast'
import { ACCOUNT_TYPES, AccountType, createAccount } from '@/lib/api/accounts'

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([\\^$|?*+()[\]{}.])/g, '\\$1') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : ''
}

export default function AccountForm() {
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  const { toast } = useToast()

  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''

  const [isSaving, setIsSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    name: '',
    type: 'ASSET' as AccountType,
    code: '',
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const token = getCookie('token') || getCookie('accessToken')
    if (!token || !businessId) {
      toast({
        title: 'Missing context',
        description: 'Authentication or business context is missing.',
        variant: 'destructive',
      })
      return
    }

    if (!form.name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Account name is required.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSaving(true)
      await createAccount(token, businessId, {
        name: form.name.trim(),
        type: form.type,
        code: form.code.trim() || undefined,
      })

      toast({
        title: 'Account created',
        description: `${form.name.trim()} was created successfully.`,
      })

      navigate(`/dashboard/${businessId}/accounts`)
    } catch (error) {
      toast({
        title: 'Create failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
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
            Create Account
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Add a new account to your chart of accounts</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4 bg-muted/50 dark:bg-slate-900/50">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Info className="h-5 w-5 text-blue-500" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Account Name *
              </label>
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Accounts Receivable"
                className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Account Type *</label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as AccountType }))}
                >
                  <SelectTrigger className="rounded-xl w-full transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="rounded-lg">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Code</label>
                <Input
                  value={form.code}
                  onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                  placeholder="e.g. ACC-1001"
                  className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="rounded-xl h-11 px-6 border-border dark:border-slate-800 bg-card dark:bg-slate-950">
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || !form.name.trim()} className="gap-2 rounded-xl h-11 px-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm transition-all hover:shadow-md">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Account'}
          </Button>
        </div>
      </form>
    </div>
  )
}