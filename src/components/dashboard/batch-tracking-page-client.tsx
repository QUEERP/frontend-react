import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import {  useLocation  } from 'react-router-dom';
import { Layers, Search, AlertTriangle } from 'lucide-react'
import { stockAPI, Batch } from '@/lib/api/inventory'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

function ExpiryBadge({ date }: { date?: string }) {
  if (!date) return <span className="text-muted-foreground text-xs">No expiry</span>
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">Expired</span>
  if (diff <= 30) return <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-medium">Expires in {diff}d</span>
  return <span className="text-sm text-muted-foreground">{new Date(date).toLocaleDateString()}</span>
}

export default function BatchTrackingPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
  const [batches, setBatches] = useState<Batch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try { setIsLoading(true); const r = await stockAPI.getBatches(businessId); setBatches(r.batches || []) }
    catch { toast({ title: 'Failed to load batches', variant: 'destructive' }) }
    finally { setIsLoading(false) }
  }, [businessId, toast])
  useEffect(() => { fetchData() }, [fetchData])

  const filtered = batches.filter(b => !search || b.batchNumber.toLowerCase().includes(search.toLowerCase()) || (b.product?.name || '').toLowerCase().includes(search.toLowerCase()))
  const expiringSoon = batches.filter(b => b.expiryDate && Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30 && new Date(b.expiryDate) > new Date()).length

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Batch Tracking</h1>
        <p className="text-sm text-muted-foreground">Track inventory by batch numbers and expiry dates</p>
      </div>
      {expiringSoon > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span><strong>{expiringSoon} batches</strong> are expiring within 30 days.</span>
        </div>
      )}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search batch # or product…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Layers className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">No batches found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-4">Batch #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="pr-4">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(b => (
                    <TableRow key={b.id} className="hover:bg-muted/20">
                      <TableCell className="pl-4 font-mono font-semibold text-sm">{b.batchNumber}</TableCell>
                      <TableCell className="text-sm font-medium">{b.product?.name || '—'}</TableCell>
                      <TableCell className="text-right font-semibold">{b.quantity}</TableCell>
                      <TableCell><ExpiryBadge date={b.expiryDate} /></TableCell>
                      <TableCell className="pr-4 text-sm text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
