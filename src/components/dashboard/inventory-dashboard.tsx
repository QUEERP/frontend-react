import * as React from 'react'
import { 
  Package, 
  Warehouse as WarehouseIcon, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Loader2,
  History
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useBusinessData } from './business-data-provider'
import { cn } from '@/lib/utils'
import { stockAPI, inventoryReportsAPI, warehousesAPI, Warehouse, StockMovement } from '@/lib/api/inventory'
import {  useLocation, useNavigate  } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns'

export function InventoryDashboard() {
  const { currency = 'AED' } = useBusinessData()
  const pathname = useLocation().pathname
  const navigate = useNavigate()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''

  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<{
    lowStock: any[]
    warehouses: Warehouse[]
    movements: StockMovement[]
    valuation: number
    lowStockCount: number
  }>({
    lowStock: [],
    warehouses: [],
    movements: [],
    valuation: 0,
    lowStockCount: 0
  })

  const fetchData = React.useCallback(async () => {
    if (!businessId) return
    try {
      setLoading(true)
      const [lowStockRes, whRes, movementsRes, valuationRes] = await Promise.all([
        inventoryReportsAPI.getLowStock(businessId),
        warehousesAPI.getAll(businessId),
        stockAPI.getMovements(businessId, { limit: '5' }),
        inventoryReportsAPI.getValuation(businessId)
      ])

      setData({
        lowStock: lowStockRes.alerts || [],
        warehouses: whRes.warehouses || [],
        movements: movementsRes.movements || [],
        valuation: valuationRes.stockValuation?.totalValue || 0,
        lowStockCount: lowStockRes.alerts?.length || 0
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Layer: Critical Alerts & High Level Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className={cn(
          "border-none shadow-xl overflow-hidden relative group transition-all",
          data.lowStockCount > 0 ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <AlertTriangle className="size-24" />
          </div>
          <CardContent className="p-6">
            <p className="text-xs font-black uppercase tracking-widest opacity-80">Critical Low Stock</p>
            <h2 className="text-4xl font-black mt-2">{data.lowStockCount}</h2>
            <p className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-tighter">
              {data.lowStockCount > 0 ? 'Items below reorder level' : 'All stock levels healthy'}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Badge className="bg-card/20 text-white border-none text-[10px] font-black">
                Real-time Status
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Warehouses</p>
              <WarehouseIcon className="size-4 text-blue-500" />
            </div>
            <h2 className="text-3xl font-black mt-2">{data.warehouses.length.toString().padStart(2, '0')}</h2>
            <div className="mt-4 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Locations monitored</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Valuation</p>
              <DollarSign className="size-4 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-black mt-2">{currency} {(data.valuation / 1000).toFixed(1)}K</h2>
            <div className="mt-4 flex items-center gap-1 text-emerald-600">
              <TrendingUp className="size-3" />
              <p className="text-[10px] font-black uppercase">Live stock value</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">System Health</p>
              <Activity className="size-4 text-primary" />
            </div>
            <h2 className="text-3xl font-black mt-2">100%</h2>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Inventory Sync Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Layer: Detailed Insights */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Low Stock Widget */}
        <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm md:col-span-2 border border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black tracking-tight">Stock Replenishment</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Action required for following items</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="font-black text-[10px] uppercase border-none bg-muted/50" onClick={() => navigate(`/dashboard/${businessId}/stock`)}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.lowStock.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                  <Package className="size-12 mb-2" />
                  <p className="text-sm font-black uppercase tracking-widest">No replenishment needed</p>
                </div>
              ) : (
                data.lowStock.slice(0, 3).map((alert, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 group hover:bg-muted/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-background rounded-xl shadow-sm">
                        <Package className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-black leading-tight">{alert.product?.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5">
                          {alert.product?.sku} • {alert.warehouse?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <span className="text-xs font-black text-rose-600">{alert.quantity}</span>
                        <span className="text-[10px] text-muted-foreground font-bold">/ {alert.reorderLevel}</span>
                      </div>
                      <Progress 
                        value={(alert.quantity / alert.reorderLevel) * 100} 
                        className="w-24 h-1.5 bg-muted group-hover:bg-background" 
                        indicatorClassName="bg-rose-500" 
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Utilization */}
        <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm border border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-black tracking-tight">Warehouse Load</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Storage utilization summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.warehouses.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                <WarehouseIcon className="size-12 mb-2" />
                <p className="text-sm font-black uppercase tracking-widest">No warehouses found</p>
              </div>
            ) : (
              data.warehouses.slice(0, 4).map((wh) => {
                const utilization = wh.stockSummary?.totalProducts ? Math.min(Math.round((wh.stockSummary.totalProducts / 1000) * 100), 100) : 0
                return (
                  <div key={wh.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs font-black">{wh.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">
                          {wh.stockSummary?.totalProducts || 0} Products • {currency} {((wh.stockSummary?.totalValue || 0) / 1000).toFixed(1)}K
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs font-black",
                        utilization > 80 ? "text-rose-600" : utilization > 50 ? "text-amber-600" : "text-emerald-600"
                      )}>{utilization}%</span>
                    </div>
                    <Progress value={utilization} className="h-2" indicatorClassName={cn(
                      utilization > 80 ? "bg-rose-500" : utilization > 50 ? "bg-amber-500" : "bg-emerald-500"
                    )} />
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Layer: Recent Movements Activity */}
      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm border border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black tracking-tight">Real-time Movement Activity</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Latest inventory transactions</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase tracking-widest gap-2" onClick={() => navigate(`/dashboard/${businessId}/stock-movements`)}>
            Movement Log
            <ArrowUpRight className="size-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-y">
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-left">Warehouse</th>
                  <th className="px-6 py-3 text-right">Quantity</th>
                  <th className="px-6 py-3 text-right">Performed By</th>
                  <th className="px-6 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center opacity-40">
                      <div className="flex flex-col items-center">
                        <History className="size-12 mb-2" />
                        <p className="text-sm font-black uppercase tracking-widest">No recent movements</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.movements.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {m.quantity < 0 ? (
                            <div className="p-1.5 bg-rose-100 rounded-lg"><ArrowUpRight className="size-3 text-rose-600" /></div>
                          ) : (
                            <div className="p-1.5 bg-emerald-100 rounded-lg"><ArrowDownLeft className="size-3 text-emerald-600" /></div>
                          )}
                          <span className="text-[10px] font-black uppercase">{m.type.replace(/_/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold">{m.product?.name}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-medium">{m.warehouse?.name}</td>
                      <td className={cn("px-6 py-4 text-xs font-black text-right", m.quantity < 0 ? 'text-rose-600' : 'text-emerald-600')}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-[10px] text-muted-foreground font-bold text-right uppercase tracking-tighter">
                        {m.performedBy?.user?.name || 'System'}
                      </td>
                      <td className="px-6 py-4 text-[10px] text-muted-foreground font-medium text-right italic">
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
