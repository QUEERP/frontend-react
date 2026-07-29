import { toast } from 'sonner';
import * as React from 'react'
import { Link } from 'react-router-dom';
import {  useLocation  } from 'react-router-dom';
import { Building2, MoreVertical, Plus, Search, Loader2, Edit, Trash2, Wallet, Layers, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  ACCOUNT_TYPES,
  Account,
  AccountType,
  createDefaultAccounts,
  deleteAccount,
  getAccountById,
  getAccounts,
  updateAccount,
} from '@/lib/api/accounts'

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([\\^$|?*+()[\]{}.])/g, '\\$1') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : ''
}

type FormState = {
  name: string
  type: AccountType
  code: string
}

const initialFormState: FormState = {
  name: '',
  type: 'ASSET',
  code: '',
}

export default function AccountsPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()

  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''

  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [filteredAccounts, setFilteredAccounts] = React.useState<Account[]>([])
  const [searchTerm, setSearchTerm] = React.useState('')

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isCreatingDefaults, setIsCreatingDefaults] = React.useState(false)

  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingAccountId, setEditingAccountId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<FormState>(initialFormState)

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null)

  const token = React.useMemo(() => getCookie('token') || getCookie('accessToken'), [])

  const loadAccounts = React.useCallback(async () => {
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to load accounts.',
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
      const list = await getAccounts(token, businessId)
      setAccounts(list)
    } catch (error) {
      toast({
        title: 'Failed to load accounts',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [businessId, toast, token])

  React.useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  React.useEffect(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) {
      setFilteredAccounts(accounts)
      return
    }

    setFilteredAccounts(
      accounts.filter((account) =>
        [account.name, account.type, account.code || '']
          .join(' ')
          .toLowerCase()
          .includes(term)
      )
    )
  }, [accounts, searchTerm])

  const openEditDialog = async (accountId: string) => {
    if (!token || !businessId) return

    try {
      setIsSaving(true)
      const account = await getAccountById(token, businessId, accountId)
      setEditingAccountId(account.id)
      setForm({
        name: account.name,
        type: account.type,
        code: account.code || '',
      })
      setIsFormOpen(true)
    } catch (error) {
      toast({
        title: 'Failed to load account',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
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
      if (editingAccountId) {
        const updated = await updateAccount(token, businessId, editingAccountId, {
          name: form.name.trim(),
          type: form.type,
          code: form.code.trim() || undefined,
        })
        setAccounts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        toast({
          title: 'Account updated',
          description: `${updated.name} was updated successfully.`,
        })
      }

      setIsFormOpen(false)
      setForm(initialFormState)
      setEditingAccountId(null)
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAccount || !token || !businessId) {
      return
    }

    try {
      await deleteAccount(token, businessId, selectedAccount.id)
      setAccounts((prev) => prev.filter((account) => account.id !== selectedAccount.id))
      toast({
        title: 'Account deleted',
        description: `${selectedAccount.name} was deactivated successfully.`,
      })
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedAccount(null)
    }
  }

  const handleCreateDefaults = async () => {
    if (!token || !businessId) return

    try {
      setIsCreatingDefaults(true)
      const message = await createDefaultAccounts(token, businessId)
      await loadAccounts()
      toast({
        title: 'Defaults created',
        description: message,
      })
    } catch (error) {
      toast({
        title: 'Default accounts failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsCreatingDefaults(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[400px] items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground">Loading accounts...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-muted/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Chart of Accounts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your accounting ledger and account categories
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleCreateDefaults} disabled={isCreatingDefaults} className="rounded-xl h-10 border-border dark:border-slate-800 bg-card dark:bg-slate-900 hover:bg-muted dark:hover:bg-slate-800 shadow-sm transition-all">
            {isCreatingDefaults ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers className="mr-2 h-4 w-4 text-blue-500" />}
            {isCreatingDefaults ? 'Creating Defaults...' : 'Create Defaults'}
          </Button>
          <Link to={`/dashboard/${businessId}/accounts/add`}>
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 h-10">
              <Plus className="h-4 w-4" />
              New Account
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/50 dark:bg-slate-900/50">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Wallet className="h-5 w-5 text-blue-500" />
              Accounts Register
            </CardTitle>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-10 rounded-xl bg-card dark:bg-slate-950 border-border dark:border-slate-800 transition-all focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, code, or type..."
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted dark:bg-slate-800 mb-4">
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground dark:text-slate-100">No accounts found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {searchTerm ? "We couldn't find any accounts matching your search." : "You haven't set up any accounts yet. Start by creating default accounts or adding a new one."}
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader className="bg-muted/80 dark:bg-slate-900/80 sticky top-0 backdrop-blur-sm">
                  <TableRow className="border-b border-border dark:border-slate-800">
                    <TableHead className="font-semibold h-11">Name</TableHead>
                    <TableHead className="font-semibold h-11 hidden sm:table-cell">Code</TableHead>
                    <TableHead className="font-semibold h-11">Type</TableHead>
                    <TableHead className="font-semibold h-11">Status</TableHead>
                    <TableHead className="font-semibold h-11 hidden md:table-cell">Created</TableHead>
                    <TableHead className="w-20 font-semibold h-11 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.id} className="border-b border-border dark:border-slate-800/60 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground dark:text-slate-100">{account.name}</span>
                          <span className="text-xs text-muted-foreground sm:hidden mt-0.5">{account.code || 'No code'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm hidden sm:table-cell text-muted-foreground">
                        {account.code ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground dark:bg-slate-800 dark:text-slate-300 border border-border dark:border-slate-700">
                            {account.code}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {account.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        {account.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm hidden md:table-cell text-muted-foreground">
                        {new Date(account.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <DropdownMenuItem onClick={() => openEditDialog(account.id)} className="rounded-lg cursor-pointer focus:bg-blue-50 focus:text-blue-600 dark:focus:bg-blue-900/30 dark:focus:text-blue-400">
                              <Edit className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-muted dark:bg-slate-800 my-1" />
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-500 dark:focus:bg-red-900/30 dark:focus:text-red-400"
                              onClick={() => {
                                setSelectedAccount(account)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
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

      {/* Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Account</DialogTitle>
            <DialogDescription>
              Update the account properties.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Account Name *</label>
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Accounts Receivable"
                className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Account Type *</label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as AccountType }))}
                >
                  <SelectTrigger className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10">
                    <SelectValue placeholder="Select type" />
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
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-500 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Deactivate Account
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Are you sure you want to deactivate <strong className="text-foreground dark:text-white">{selectedAccount?.name}</strong>? It will no longer be available for new transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-red-600 hover:bg-red-700 gap-2" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" /> Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
