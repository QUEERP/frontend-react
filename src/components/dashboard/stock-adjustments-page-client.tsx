import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import {  useLocation  } from 'react-router-dom';
import { SlidersHorizontal, Search, Plus, Trash2, MoreVertical, Eye, Loader2 } from 'lucide-react'
import { stockAPI, StockAdjustment } from '@/lib/api/inventory'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Link } from 'react-router-dom';
import { useBusinessData } from './business-data-provider'

export default function StockAdjustmentsPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()
  const { business } = useBusinessData()
  const isTrading = business?.businessType?.toLowerCase() === 'trading'
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try { setIsLoading(true); const r = await stockAPI.getAdjustments(businessId); setAdjustments(r.adjustments || []) }
    catch { toast({ title: 'Failed to load adjustments', variant: 'destructive' }) }
    finally { setIsLoading(false) }
  }, [businessId])
  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true)
      await stockAPI.deleteAdjustment(businessId, id)
      toast({ title: 'Adjustment deleted' })
      fetchData()
    } catch (error: any) {
      toast({ title: 'Failed to delete', description: error?.message, variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const filtered = adjustments.filter(a => !search || a.reason.toLowerCase().includes(search.toLowerCase()))
  const STATUS_COLORS: Record<string, string> = { DRAFT: 'bg-gray-100 text-gray-700', APPROVED: 'bg-emerald-100 text-emerald-800', REJECTED: 'bg-red-100 text-red-700' }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Adjustments</h1>
          <p className="text-sm text-muted-foreground">Correct inventory discrepancies with audit trail</p>
        </div>
        <Link to={`/dashboard/${businessId}/stock-adjustments/new`}><Button className="gap-2"><Plus className="h-4 w-4" />New Adjustment</Button></Link>
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reason…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <SlidersHorizontal className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">No stock adjustments yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-4">Reason</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(a => (
                    <TableRow key={a.id} className="hover:bg-muted/20">
                      <TableCell className="pl-4 font-medium text-sm">{a.reason}</TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium">{a.warehouse?.name || '—'}</div>
                        {isTrading && a.location && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Loc: {a.location.name ? `${a.location.code} - ${a.location.name}` : a.location.code}
                          </div>
                        )}
                      </TableCell>
                      <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-700'}`}>{a.status}</span></TableCell>
                      <TableCell className="text-sm">{a.items?.length || 0} items</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/dashboard/${businessId}/stock-adjustments/${a.id}`} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="flex items-center gap-2 text-destructive"
                              onClick={() => setDeleteId(a.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Adjustment
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
          <AlertDialogTitle>Delete Adjustment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this stock adjustment? This will reverse the quantity changes. This action cannot be undone.
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
