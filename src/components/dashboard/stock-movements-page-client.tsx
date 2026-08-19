import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import {  useLocation, useNavigate, useSearchParams  } from 'react-router-dom';
import { 
  History, 
  Search, 
  Filter, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  ArrowRightLeft, 
  Settings, 
  RotateCcw, 
  Download, 
  Loader2, 
  Calendar as CalendarIcon,
  Package,
  ArrowLeft,
  FileText
} from 'lucide-react'
import { stockAPI, StockMovement } from '@/lib/api/inventory'
import { useBusinessData } from './business-data-provider'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const MOVEMENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; sign: string; category: string }> = {
  PURCHASE_IN:    { label: 'Purchase In',    icon: ArrowDownCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', sign: '+', category: 'External' },
  SALE_OUT:       { label: 'Sale Out',       icon: ArrowUpCircle,    color: 'text-rose-600',    bg: 'bg-rose-50 text-rose-700 border-rose-100',         sign: '−', category: 'External' },
  TRANSFER_IN:    { label: 'Transfer In',    icon: ArrowRightLeft,   color: 'text-indigo-600',  bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',   sign: '+', category: 'Internal' },
  TRANSFER_OUT:   { label: 'Transfer Out',   icon: ArrowRightLeft,   color: 'text-violet-600',  bg: 'bg-violet-50 text-violet-700 border-violet-100',   sign: '−', category: 'Internal' },
  ADJUSTMENT_IN:  { label: 'Adjustment In',  icon: Settings,         color: 'text-sky-600',     bg: 'bg-sky-50 text-sky-700 border-sky-100',         sign: '+', category: 'Internal' },
  ADJUSTMENT_OUT: { label: 'Adjustment Out', icon: Settings,         color: 'text-orange-600',  bg: 'bg-orange-50 text-orange-700 border-orange-100',   sign: '−', category: 'Internal' },
  RETURN_IN:      { label: 'Return In',      icon: RotateCcw,        color: 'text-teal-600',    bg: 'bg-teal-50 text-teal-700 border-teal-100',       sign: '+', category: 'External' },
  RETURN_OUT:     { label: 'Return Out',     icon: RotateCcw,        color: 'text-pink-600',    bg: 'bg-pink-50 text-pink-700 border-pink-100',       sign: '−', category: 'External' },
  OPENING_STOCK:  { label: 'Opening Stock',  icon: ArrowDownCircle,  color: 'text-gray-600',    bg: 'bg-gray-50 text-gray-700 border-gray-100',       sign: '+', category: 'Internal' },
}

export default function StockMovementsPageClient() {
  const pathname = useLocation().pathname
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { business } = useBusinessData()
  const isTrading = business?.businessType?.toLowerCase() === 'trading'
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
  
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const productIdParam = searchParams.get('productId')

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try {
      setIsLoading(true)
      const params: Record<string, string> = {}
      let productId = '';
      if (productIdParam) productId = productIdParam
      
      const r = await stockAPI.getMovements(businessId, params)
      setMovements(r.movements || [])
    } catch {
      toast({ title: 'Failed to load movements', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [businessId, productIdParam])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = movements.filter(m => {
    const term = search.toLowerCase()
    const matchSearch = !term || 
      (m.product?.name || '').toLowerCase().includes(term) || 
      (m.product?.sku || '').toLowerCase().includes(term) ||
      (m.warehouse?.name || '').toLowerCase().includes(term)
    const matchType = typeFilter === 'all' || m.type === typeFilter
    
    const config = MOVEMENT_CONFIG[m.type]
    const matchCategory = categoryFilter === 'all' || (config && config.category === categoryFilter)
    
    return matchSearch && matchType && matchCategory
  })

  const handleExport = () => {
    if (filtered.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' })
      return
    }

    const headers = ['Date', 'Category', 'Type', 'Product', 'SKU', 'Warehouse', ...(isTrading ? ['Location'] : []), 'Quantity', 'Reference', 'Performed By']
    const csvContent = [
      headers.join(','),
      ...filtered.map(m => {
        const config = MOVEMENT_CONFIG[m.type] || { category: 'Internal' }
        return [
          `"${format(new Date(m.createdAt), 'yyyy-MM-dd HH:mm')}"`,
          `"${config.category}"`,
        `"${m.type}"`,
        `"${m.product?.name || ''}"`,
        `"${m.product?.sku || ''}"`,
        `"${m.warehouse?.name || ''}"`,
        ...(isTrading ? [`"${m.location?.name ? `${m.location.code} - ${m.location.name}` : (m.location?.code || '')}"`] : []),
        m.quantity,
        `"${m.referenceType || ''}"`,
        `"${m.performedBy?.user?.name || 'System'}"`
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Stock_Movements_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast({ title: 'Report downloaded' })
  }

  return (
    <div className="flex flex-col gap-8 p-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl shadow-sm border border-primary/20">
            <History className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Stock Movements</h1>
            <p className="text-sm text-muted-foreground font-medium">Complete audit trail of all inventory changes and transfers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {productIdParam && (
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(pathname)}>
              <ArrowLeft className="h-4 w-4" /> Clear Filter
            </Button>
          )}
          <Button variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/5" onClick={handleExport}>
            <Download className="size-4" />
            Export Audit Log
          </Button>
        </div>
      </div>

      {productIdParam && movements.length > 0 && (
        <Card className="border-none shadow-sm bg-primary/5 border border-primary/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="size-5 text-primary" />
              <div>
                <p className="text-xs font-bold text-primary/60 uppercase tracking-widest leading-none mb-1">Filtering by Product</p>
                <p className="text-sm font-black">{movements[0].product?.name} ({movements[0].product?.sku})</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-background border-primary/20 text-primary font-bold">
              {filtered.length} Movements Found
            </Badge>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4 pt-6 px-6 bg-muted/30 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input 
                placeholder="Search by product, SKU or warehouse..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-10 h-11 border-none bg-background shadow-sm rounded-xl" 
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-11 w-full sm:w-48 border-none bg-background shadow-sm rounded-xl">
                  <Filter className="h-4 w-4 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Internal & External</SelectItem>
                  <SelectItem value="Internal">Internal Only</SelectItem>
                  <SelectItem value="External">External Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-11 w-full sm:w-52 border-none bg-background shadow-sm rounded-xl">
                  <Filter className="h-4 w-4 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Movement Types</SelectItem>
                  {Object.entries(MOVEMENT_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      <div className="flex items-center gap-2">
                        <v.icon className={cn("size-3.5", v.color)} />
                        {v.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-10 w-32 rounded-lg" />
                  <Skeleton className="h-10 flex-1 rounded-lg" />
                  <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center opacity-40">
              <History className="size-20 text-muted-foreground" />
              <div>
                <p className="text-lg font-black uppercase tracking-widest">No History Found</p>
                <p className="text-sm font-medium">Try adjusting your filters or search terms</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-muted-foreground">Timestamp</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-muted-foreground">Activity Type</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-muted-foreground">Category</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-muted-foreground">Product & SKU</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-muted-foreground">Warehouse</th>
                    {isTrading && <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-muted-foreground">Location</th>}
                    <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-muted-foreground">Reference</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-muted-foreground">User</th>
                    <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-wider text-muted-foreground pr-8">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(m => {
                    const cfg = MOVEMENT_CONFIG[m.type] || { label: m.type, icon: History, color: 'text-gray-600', bg: 'bg-gray-100 text-gray-700', sign: '' }
                    const Icon = cfg.icon
                    const isPositive = cfg.sign === '+'
                    
                    return (
                      <tr key={m.id} className="group hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{format(new Date(m.createdAt), 'MMM dd, yyyy')}</span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(m.createdAt), 'HH:mm')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={cn("text-[10px] uppercase font-black px-2 py-0.5 border-none shadow-none", cfg.bg)}>
                            <Icon className="h-3 w-3 mr-1" />{cfg.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] uppercase font-bold px-2 py-1 rounded-md",
                            cfg.category === 'Internal' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'
                          )}>
                            {cfg.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold leading-none">{m.product?.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground mt-1">{m.product?.sku}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-foreground">{m.warehouse?.name}</span>
                        </td>
                        {isTrading && (
                          <td className="px-6 py-4">
                            <span className="text-[12px] font-medium text-muted-foreground">
                              {m.location ? (m.location.name ? `${m.location.code} - ${m.location.name}` : m.location.code) : '—'}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary/70 bg-primary/5 px-2 py-1 rounded-md border border-primary/10 w-fit">
                            <FileText className="size-3" />
                            {m.referenceType || 'ADJUSTMENT'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-muted-foreground">{m.performedBy?.user?.name || 'System'}</span>
                        </td>
                        <td className={cn(
                          "px-6 py-4 text-right pr-8 font-black text-sm",
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        )}>
                          {cfg.sign}{m.quantity.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {filtered.length > 0 && (
          <div className="bg-muted/30 px-6 py-3 border-t">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total: {filtered.length} Ledger Entries Found</p>
          </div>
        )}
      </Card>
    </div>
  )
}
