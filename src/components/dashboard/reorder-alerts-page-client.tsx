import { toast } from 'sonner';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Search, 
  Download, 
  Package, 
  Building2, 
  AlertCircle, 
  ShoppingCart,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { inventoryReportsAPI } from '@/lib/api/inventory';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface RawAlert {
  productId?: string;
  productName?: string;
  sku?: string;
  warehouseId?: string;
  warehouseName?: string;
  currentStock?: number;
  reservedQty?: number;
  availableQty?: number;
  reorderLevel?: number;
  minimumStock?: number;
  reorderQty?: number;
  incomingQty?: number;
  severity?: 'CRITICAL' | 'WARNING';
  product?: { id: string; name: string; sku: string; reorderLevel?: number; reorderQty?: number };
  warehouse?: { id: string; name: string };
  quantity?: number;
}

export default function ReorderAlertsPageClient() {
  const pathname = useLocation().pathname;
  const { toast } = useToast();
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';
  const [alerts, setAlerts] = useState<RawAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const fetchData = useCallback(async () => {
    if (!businessId) return;
    try {
      setIsLoading(true);
      const res = await inventoryReportsAPI.getLowStock(businessId);
      setAlerts((res.alerts as RawAlert[]) || []);
    } catch {
      toast({ title: 'Failed to load reorder alerts', variant: 'destructive' });
    } finally { 
      setIsLoading(false); 
    }
  }, [businessId, toast]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const normalizedAlerts = useMemo(() => {
    return alerts.map(a => {
      const productName = a.productName || a.product?.name || (a as any).name || 'Unnamed Product';
      const sku = a.sku || a.product?.sku || (a as any).productSku || '—';
      const warehouseName = a.warehouseName || a.warehouse?.name || (a as any).whName || '—';
      const currentStock = a.currentStock ?? a.quantity ?? (a as any).stock ?? 0;
      const reservedQty = a.reservedQty ?? 0;
      const available = a.availableQty ?? (currentStock - reservedQty);
      const reorderLevel = a.reorderLevel ?? a.product?.reorderLevel ?? 0;
      const minimumStock = a.minimumStock ?? 0;
      const reorderQty = a.reorderQty ?? a.product?.reorderQty ?? (reorderLevel > currentStock ? Math.max(0, Math.ceil(reorderLevel - currentStock)) : 0);
      const productId = a.productId || a.product?.id || '';
      const severity = a.severity || (available <= 0 ? 'CRITICAL' : 'WARNING');
      const isCritical = severity === 'CRITICAL' || available <= 0;

      return {
        ...a,
        productName,
        sku,
        warehouseName,
        currentStock,
        reservedQty,
        available,
        reorderLevel,
        minimumStock,
        reorderQty,
        productId,
        severity,
        isCritical
      };
    });
  }, [alerts]);

  const filtered = useMemo(() => {
    return normalizedAlerts.filter(a => {
      const term = search.toLowerCase();
      const matchSearch = !term || 
        a.productName.toLowerCase().includes(term) || 
        a.sku.toLowerCase().includes(term) ||
        a.warehouseName.toLowerCase().includes(term);

      const matchSeverity = severityFilter === 'all' || 
        (severityFilter === 'CRITICAL' && a.isCritical) ||
        (severityFilter === 'WARNING' && !a.isCritical);

      return matchSearch && matchSeverity;
    });
  }, [normalizedAlerts, search, severityFilter]);

  const stats = useMemo(() => {
    const total = normalizedAlerts.length;
    const critical = normalizedAlerts.filter(a => a.isCritical).length;
    const warning = normalizedAlerts.filter(a => !a.isCritical).length;
    const warehouses = new Set(normalizedAlerts.map(a => a.warehouseName).filter(Boolean)).size;
    return { total, critical, warning, warehouses };
  }, [normalizedAlerts]);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const headers = ['Product', 'SKU', 'Warehouse', 'Current Stock', 'Available Qty', 'Reorder Level', 'Reorder Qty', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filtered.map(a => [
        `"${a.productName}"`,
        `"${a.sku}"`,
        `"${a.warehouseName}"`,
        a.currentStock,
        a.available,
        a.reorderLevel,
        a.reorderQty,
        a.isCritical ? 'Out of Stock / Critical' : 'Low Stock Warning'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Reorder_Alerts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Report downloaded successfully' });
  };

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Reorder Alerts
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Products that have breached minimum stock levels and require replenishment.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="h-10 rounded-xl border-border text-foreground hover:bg-muted font-semibold gap-2 shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </Button>
          <Link to={`/dashboard/${businessId}/purchase-orders/new`}>
            <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Create Purchase Order</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Out of Stock
                </p>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.critical}
                </div>
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Critical shortage</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Low Stock
                </p>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.warning}
                </div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Near reorder point</p>
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
                  Total Alert Items
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.total}
                </div>
                <p className="text-xs font-medium text-muted-foreground">SKUs below threshold</p>
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
                  Warehouses Affected
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.warehouses}
                </div>
                <p className="text-xs font-medium text-muted-foreground">Locations needing restock</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Directory Card */}
      <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden flex-1 flex flex-col w-full min-w-0 max-w-full">
        <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Alerts Directory</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {alerts.length} reorder alerts
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search product, SKU or warehouse..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="pl-9 h-10 rounded-xl border-border bg-card focus-visible:ring-blue-500 text-sm shadow-sm" 
                />
              </div>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl border-border bg-card shadow-sm text-sm font-medium">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="CRITICAL">Out of Stock</SelectItem>
                  <SelectItem value="WARNING">Low Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="p-4 bg-muted rounded-full mb-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-foreground">All products are healthy</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                No inventory items are currently at or below their reorder threshold.
              </p>
            </div>
          ) : (
            <Table className="w-full min-w-[950px]">
              <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground pl-6">Product & SKU</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Warehouse</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Current Stock</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Available Qty</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Reorder Level</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Reorder Qty</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {filtered.map((a, i) => (
                  <TableRow key={i} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-foreground leading-tight">{a.productName}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">{a.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium text-foreground">
                      {a.warehouseName}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <span className={cn(
                        "text-sm font-bold",
                        a.isCritical ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"
                      )}>
                        {a.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <span className={cn(
                        "text-sm font-black",
                        a.isCritical ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"
                      )}>
                        {a.available}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-center text-sm font-mono font-medium text-muted-foreground">
                      {a.reorderLevel}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {a.reorderQty > 0 ? `+${a.reorderQty}` : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      {a.isCritical ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                          <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                          Out of Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                          <span className="size-1.5 rounded-full bg-amber-500" />
                          Low Stock
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <Link to={`/dashboard/${businessId}/purchase-orders/new?productId=${a.productId}`}>
                        <Button size="sm" className="h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm gap-1.5">
                          <ShoppingCart className="size-3.5" />
                          Request PO
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
