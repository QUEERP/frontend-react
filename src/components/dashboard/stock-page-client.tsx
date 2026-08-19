import * as React from 'react'
import { 
  Search, 
  Filter, 
  Download, 
  Warehouse as WarehouseIcon, 
  AlertTriangle, 
  DollarSign, 
  Package,
  MoreVertical,
  History,
  ArrowRightLeft,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useBusinessData } from './business-data-provider'
import { cn } from '@/lib/utils'
import { stockAPI, StockLevel, warehousesAPI, Warehouse } from '@/lib/api/inventory'
import { toast } from 'sonner'
import {  useLocation, useNavigate  } from 'react-router-dom';

export default function StockPageClient() {
  const { currency = 'AED', business } = useBusinessData()
  const isTrading = business?.businessType?.toLowerCase() === 'trading'
  const pathname = useLocation().pathname
  const navigate = useNavigate()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''

  const [searchTerm, setSearchTerm] = React.useState('')
  const [warehouseFilter, setWarehouseFilter] = React.useState('all')
  const [stock, setStock] = React.useState<StockLevel[]>([])
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchData = React.useCallback(async () => {
    if (!businessId) return
    try {
      setLoading(true)
      const [stockRes, whRes] = await Promise.all([
        stockAPI.getLevels(businessId),
        warehousesAPI.getAll(businessId)
      ])
      
      if (stockRes.success) setStock(stockRes.stock || [])
      if (whRes.success) setWarehouses(whRes.warehouses || [])
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load stock levels')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredStock = React.useMemo(() => {
    return stock.filter(item => {
      const matchesSearch = 
        item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesWarehouse = warehouseFilter === 'all' || item.warehouseId === warehouseFilter
      
      return matchesSearch && matchesWarehouse
    })
  }, [stock, searchTerm, warehouseFilter])

  const stats = React.useMemo(() => {
    const totalStock = filteredStock.reduce((sum, s) => sum + s.quantity, 0)
    const totalValuation = filteredStock.reduce((sum, s) => sum + (s.quantity * (s.product?.costPrice || 0)), 0)
    const lowStockCount = filteredStock.filter(s => (s.quantity - s.reservedQty) <= (s.product?.reorderLevel || 0)).length
    const activeWarehouses = warehouses.filter(w => w.isActive).length

    return { totalStock, totalValuation, lowStockCount, activeWarehouses }
  }, [filteredStock, warehouses])

  const handleDownload = () => {
    if (filteredStock.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = ['Product', 'SKU', 'Warehouse', ...(isTrading ? ['Location'] : []), 'Physical', 'Reserved', 'Available', 'Valuation', 'Unit']
    const csvContent = [
      headers.join(','),
      ...filteredStock.map(s => [
        `"${s.product?.name || ''}"`,
        `"${s.product?.sku || ''}"`,
        `"${s.warehouse?.name || ''}"`,
        ...(isTrading ? [`"${s.location?.name ? `${s.location.code} - ${s.location.name}` : (s.location?.code || '')}"`] : []),
        s.quantity,
        s.reservedQty,
        s.quantity - s.reservedQty,
        s.quantity * (s.product?.costPrice || 0),
        `"${typeof s.product?.unit === 'object' ? s.product?.unit?.name : s.product?.unit || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Stock_Report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Report downloaded')
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Stock Levels</h1>
          <p className="text-sm text-muted-foreground font-medium">Real-time inventory visibility across all warehouses</p>
        </div>
        <Button onClick={handleDownload} variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
          <Download className="size-4" />
          Export Report
        </Button>
      </div>

      {/* Analytics Header */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm dark:bg-slate-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Physical Stock</p>
              <Package className="size-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-black tracking-tight">{stats.totalStock.toLocaleString()}</h2>
              <span className="text-xs text-muted-foreground font-medium">units</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm dark:bg-slate-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Inventory Valuation</p>
              <DollarSign className="size-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-black tracking-tight">{currency} {stats.totalValuation.toLocaleString()}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm dark:bg-slate-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Low Stock Alerts</p>
              <AlertTriangle className="size-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-black tracking-tight text-amber-600">{stats.lowStockCount}</h2>
              <span className="text-xs text-muted-foreground font-medium">alerts</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm dark:bg-slate-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Warehouses</p>
              <WarehouseIcon className="size-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-black tracking-tight">{stats.activeWarehouses}</h2>
              <span className="text-xs text-muted-foreground font-medium">locations</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-6 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by SKU or Product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-none bg-background shadow-sm rounded-xl"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger className="w-[200px] h-10 border-none bg-background shadow-sm rounded-xl">
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-muted-foreground">Product & SKU</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-muted-foreground">Warehouse</th>
                  {isTrading && <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-muted-foreground">Location</th>}
                  <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-wider text-muted-foreground">Physical</th>
                  <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-wider text-muted-foreground">Reserved</th>
                  <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-wider text-muted-foreground">Available</th>
                  <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-wider text-muted-foreground">Valuation</th>
                  <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-4 w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStock.map((item) => {
                  const available = item.quantity - item.reservedQty
                  const isLow = available <= (item.product?.reorderLevel || 0)
                  const valuation = item.quantity * (item.product?.costPrice || 0)

                  return (
                    <tr key={item.id} className="group hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-foreground leading-tight">{item.product?.name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground mt-1">{item.product?.sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <WarehouseIcon className="size-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium">{item.warehouse?.name}</span>
                        </div>
                      </td>
                      {isTrading && (
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-muted-foreground">
                            {item.location ? (item.location.name ? `${item.location.code} - ${item.location.name}` : item.location.code) : '-'}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold">{item.quantity}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {typeof item.product?.unit === 'object' ? item.product?.unit?.abbreviation : item.product?.unit || 'pcs'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className="text-[10px] font-medium h-5 px-2 bg-muted/50 border-none">
                          {item.reservedQty}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "text-sm font-black",
                          isLow ? "text-amber-600" : "text-emerald-600"
                        )}>
                          {available}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-foreground">
                          {currency} {valuation.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isLow ? (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 text-[10px] font-black uppercase">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 text-[10px] font-black uppercase">Healthy</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => navigate(`/dashboard/${businessId}/stock-movements?productId=${item.productId}`)}>
                              <History className="size-4" />
                              View History
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => navigate(`/dashboard/${businessId}/stock-transfers/new?productId=${item.productId}`)}>
                              <ArrowRightLeft className="size-4" />
                              Transfer Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => navigate(`/dashboard/${businessId}/stock-adjustments/new?productId=${item.productId}`)}>
                              <AlertTriangle className="size-4" />
                              Adjust Stock
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
