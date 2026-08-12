import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import {  useLocation  } from 'react-router-dom';
import { ArrowRightLeft, Search, Plus, CheckCircle, Clock, XCircle, MoreVertical, Eye, Trash2, Loader2 } from 'lucide-react'
import { stockAPI, StockTransfer } from '@/lib/api/inventory'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Link } from 'react-router-dom';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default function StockTransfersPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try { setIsLoading(true); const r = await stockAPI.getTransfers(businessId); setTransfers(r.transfers || []) }
    catch { toast({ title: 'Failed to load transfers', variant: 'destructive' }) }
    finally { setIsLoading(false) }
  }, [businessId])
  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true)
      await stockAPI.deleteTransfer(businessId, id)
      toast({ title: 'Transfer deleted' })
      fetchData()
    } catch (error: any) {
      toast({ title: 'Failed to delete', description: error?.message, variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const filtered = transfers.filter(t => !search || t.transferNumber.toLowerCase().includes(search.toLowerCase()) || (t.fromWarehouse?.name || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Transfers</h1>
          <p className="text-sm text-muted-foreground">Move inventory between warehouses</p>
        </div>
        <Link to={`/dashboard/${businessId}/stock-transfers/new`}><Button className="gap-2"><Plus className="h-4 w-4" />New Transfer</Button></Link>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: transfers.length, color: 'bg-indigo-500', icon: ArrowRightLeft },
          { label: 'Completed', value: transfers.filter(t => t.status === 'COMPLETED').length, color: 'bg-emerald-500', icon: CheckCircle },
          { label: 'Pending', value: transfers.filter(t => t.status === 'PENDING').length, color: 'bg-amber-500', icon: Clock },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="border-0 shadow-sm"><CardContent className="flex items-center gap-4 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}><Icon className="h-5 w-5 text-white" /></div>
            <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div>
          </CardContent></Card>
        ))}
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search transfer or warehouse…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <ArrowRightLeft className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">No stock transfers found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-4">Transfer #</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(t => (
                    <TableRow key={t.id} className="hover:bg-muted/20">
                      <TableCell className="pl-4 font-mono font-semibold text-sm">{t.transferNumber}</TableCell>
                      <TableCell className="text-sm">{t.fromWarehouse?.name || '—'}</TableCell>
                      <TableCell className="text-sm">{t.toWarehouse?.name || '—'}</TableCell>
                      <TableCell className="text-sm">{t.items?.length || 0}</TableCell>
                      <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-700'}`}>{t.status}</span></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/dashboard/${businessId}/stock-transfers/${t.id}`} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="flex items-center gap-2 text-destructive"
                              onClick={() => setDeleteId(t.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Transfer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Transfer</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this stock transfer? This will reverse the movement between warehouses. This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
