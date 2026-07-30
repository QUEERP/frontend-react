import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import {  useLocation  } from 'react-router-dom';
import { AlertTriangle, Search, TrendingDown } from 'lucide-react'
import { stockAPI } from '@/lib/api/inventory'
import { inventoryReportsAPI } from '@/lib/api/inventory'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button'

interface Alert { product: { id: string; name: string; sku: string; reorderLevel?: number; reorderQty?: number }; warehouse: { id: string; name: string }; quantity: number; reorderLevel: number }

export default function ReorderAlertsPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try {
      setIsLoading(true)
      const res = await inventoryReportsAPI.getLowStock(businessId)
      setAlerts((res.alerts as Alert[]) || [])
    } catch {
      toast({ title: 'Failed to load reorder alerts', variant: 'destructive' })
    } finally { setIsLoading(false) }
  }, [businessId, toast])
  useEffect(() => { fetchData() }, [fetchData])

  const filtered = alerts.filter(a => !search || a.product.name.toLowerCase().includes(search.toLowerCase()) || a.warehouse.name.toLowerCase().includes(search.toLowerCase()))
  const critical = alerts.filter(a => a.quantity <= 0).length
  const low = alerts.filter(a => a.quantity > 0 && a.quantity <= a.reorderLevel).length

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reorder Alerts</h1>
        <p className="text-sm text-muted-foreground">Products that need to be restocked</p>
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <Card className="border-0 shadow-sm bg-red-50"><CardContent className="p-4"><p className="text-xs text-red-700 font-medium">Out of Stock</p><p className="text-2xl font-bold text-red-700">{critical}</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-amber-50"><CardContent className="p-4"><p className="text-xs text-amber-700 font-medium">Low Stock</p><p className="text-2xl font-bold text-amber-700">{low}</p></CardContent></Card>
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search product or warehouse…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">All products are well-stocked!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-4">Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead className="text-right">Reorder Qty</TableHead>
                    <TableHead className="pr-4">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a, i) => {
                    const isCritical = a.quantity <= 0
                    return (
                      <TableRow key={i} className={`hover:bg-muted/20 ${isCritical ? 'bg-red-50/40' : 'bg-amber-50/30'}`}>
                        <TableCell className="pl-4 font-medium text-sm">{a.product.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{a.product.sku}</TableCell>
                        <TableCell className="text-sm">{a.warehouse.name}</TableCell>
                        <TableCell className={`text-right font-bold ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>{a.quantity}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{a.reorderLevel}</TableCell>
                        <TableCell className="text-right text-sm text-indigo-600 font-medium">{a.product.reorderQty || '—'}</TableCell>
                        <TableCell className="pr-4">
                          <Link to={`/dashboard/${businessId}/purchase-requests/new?productId=${a.product.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs">Request PO</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
