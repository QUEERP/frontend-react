import * as React from 'react';
import { 
  Search, 
  Download, 
  Warehouse as WarehouseIcon, 
  AlertTriangle, 
  DollarSign, 
  Package,
  MoreVertical,
  History,
  ArrowRightLeft,
  CheckCircle2,
  TrendingUp,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useBusinessData } from './business-data-provider';
import { cn } from '@/lib/utils';
import { stockAPI, StockLevel, warehousesAPI, Warehouse } from '@/lib/api/inventory';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';

export default function StockPageClient() {
  const { currency = 'AED', business } = useBusinessData();
  const isTrading = business?.businessType?.toLowerCase() === 'trading';
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';

  const [searchTerm, setSearchTerm] = React.useState('');
  const [warehouseFilter, setWarehouseFilter] = React.useState('all');
  const [stock, setStock] = React.useState<StockLevel[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const [stockRes, whRes] = await Promise.all([
        stockAPI.getLevels(businessId),
        warehousesAPI.getAll(businessId)
      ]);
      
      if (stockRes.success) setStock(stockRes.stock || []);
      if (whRes.success) setWarehouses(whRes.warehouses || []);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load stock levels');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredStock = React.useMemo(() => {
    return stock.filter(item => {
      const matchesSearch = 
        item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesWarehouse = warehouseFilter === 'all' || item.warehouseId === warehouseFilter;
      
      return matchesSearch && matchesWarehouse;
    });
  }, [stock, searchTerm, warehouseFilter]);

  const stats = React.useMemo(() => {
    const totalStock = filteredStock.reduce((sum, s) => sum + s.quantity, 0);
    const totalValuation = filteredStock.reduce((sum, s) => sum + (s.quantity * (s.product?.costPrice || 0)), 0);
    const lowStockCount = filteredStock.filter(s => (s.quantity - s.reservedQty) <= (s.product?.reorderLevel || 0)).length;
    const activeWarehouses = warehouses.filter(w => w.isActive).length;

    return { totalStock, totalValuation, lowStockCount, activeWarehouses };
  }, [filteredStock, warehouses]);

  const handleDownload = () => {
    if (filteredStock.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Product', 'SKU', 'Warehouse', ...(isTrading ? ['Location'] : []), 'Physical', 'Reserved', 'Available', 'Valuation', 'Unit'];
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
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Stock_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report downloaded');
  };

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Stock Levels
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Real-time inventory visibility and valuation across all warehouses.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleDownload} 
            variant="outline" 
            className="h-10 rounded-xl border-border text-foreground hover:bg-muted font-semibold gap-2 shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total Physical Stock
                </p>
                <div className="text-2xl font-black text-foreground">
                  {loading ? <Skeleton className="h-8 w-20" /> : stats.totalStock.toLocaleString()}
                </div>
                <p className="text-xs font-medium text-muted-foreground">Units in inventory</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Inventory Valuation
                </p>
                <div className="text-2xl font-black text-foreground">
                  {loading ? <Skeleton className="h-8 w-24" /> : `${currency} ${stats.totalValuation.toLocaleString()}`}
                </div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Total cost valuation</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Low Stock Alerts
                </p>
                <div className="text-2xl font-black text-foreground">
                  {loading ? <Skeleton className="h-8 w-16" /> : stats.lowStockCount}
                </div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">At or below reorder level</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Active Warehouses
                </p>
                <div className="text-2xl font-black text-foreground">
                  {loading ? <Skeleton className="h-8 w-16" /> : stats.activeWarehouses}
                </div>
                <p className="text-xs font-medium text-muted-foreground">Operating locations</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                <WarehouseIcon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Directory Card */}
      <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden flex-1 flex flex-col w-full min-w-0 max-w-full">
        <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-6 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Stock Inventory</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                Showing <span className="text-foreground font-semibold">{filteredStock.length}</span> of {stock.length} inventory records
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by SKU or Product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 rounded-xl border-border bg-card focus-visible:ring-blue-500 text-sm shadow-sm"
                />
              </div>
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl border-border bg-card shadow-sm text-sm font-medium">
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="p-4 bg-muted rounded-full mb-3">
                <Package className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-foreground">No stock records found</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                {searchTerm || warehouseFilter !== 'all' 
                  ? 'No inventory matches your active filter criteria.' 
                  : 'No inventory data is currently tracked for this organization.'}
              </p>
            </div>
          ) : (
            <Table className="w-full min-w-[950px]">
              <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground pl-6">Product & SKU</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Warehouse</TableHead>
                  {isTrading && (
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Location</TableHead>
                  )}
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Physical</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Reserved</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Available</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Valuation</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Status</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {filteredStock.map((item) => {
                  const available = item.quantity - item.reservedQty;
                  const isLow = available <= (item.product?.reorderLevel || 0);
                  const valuation = item.quantity * (item.product?.costPrice || 0);

                  return (
                    <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-foreground leading-tight">{item.product?.name || 'Unnamed Product'}</p>
                          <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.product?.sku || 'NO-SKU'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <WarehouseIcon className="size-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{item.warehouse?.name || '—'}</span>
                        </div>
                      </TableCell>
                      {isTrading && (
                        <TableCell className="py-4">
                          <span className="text-sm text-muted-foreground">
                            {item.location ? (item.location.name ? `${item.location.code} - ${item.location.name}` : item.location.code) : '—'}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="py-4 text-center">
                        <span className="text-sm font-bold text-foreground">{item.quantity}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {typeof item.product?.unit === 'object' ? item.product?.unit?.abbreviation : item.product?.unit || 'pcs'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                          {item.reservedQty}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <span className={cn(
                          "text-sm font-black",
                          isLow ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                        )}>
                          {available}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <span className="text-sm font-black text-foreground">
                          {currency} {valuation.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Healthy
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/stock-movements?productId=${item.productId}`)}>
                              <History className="size-4 text-blue-600" />
                              View History
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/stock-transfers/new?productId=${item.productId}`)}>
                              <ArrowRightLeft className="size-4 text-indigo-600" />
                              Transfer Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/stock-adjustments/new?productId=${item.productId}`)}>
                              <AlertTriangle className="size-4" />
                              Adjust Stock
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
