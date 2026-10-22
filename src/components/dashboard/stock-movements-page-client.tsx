import { toast } from 'sonner';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  Calendar as CalendarIcon,
  Package, 
  ArrowLeft, 
  FileText,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { stockAPI, StockMovement } from '@/lib/api/inventory';
import { useBusinessData } from './business-data-provider';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const MOVEMENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; sign: string; category: string }> = {
  PURCHASE_IN:    { label: 'Purchase In',    icon: ArrowDownCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60', sign: '+', category: 'External' },
  SALE_OUT:       { label: 'Sale Out',       icon: ArrowUpCircle,    color: 'text-rose-600',    bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60',         sign: '−', category: 'External' },
  TRANSFER_IN:    { label: 'Transfer In',    icon: ArrowRightLeft,   color: 'text-indigo-600',  bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60',   sign: '+', category: 'Internal' },
  TRANSFER_OUT:   { label: 'Transfer Out',   icon: ArrowRightLeft,   color: 'text-violet-600',  bg: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200 dark:border-violet-800/60',   sign: '−', category: 'Internal' },
  ADJUSTMENT_IN:  { label: 'Adjustment In',  icon: Settings,         color: 'text-sky-600',     bg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60',         sign: '+', category: 'Internal' },
  ADJUSTMENT_OUT: { label: 'Adjustment Out', icon: Settings,         color: 'text-orange-600',  bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60',   sign: '−', category: 'Internal' },
  RETURN_IN:      { label: 'Return In',      icon: RotateCcw,        color: 'text-teal-600',    bg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60',       sign: '+', category: 'External' },
  RETURN_OUT:     { label: 'Return Out',     icon: RotateCcw,        color: 'text-pink-600',    bg: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400 border border-pink-200 dark:border-pink-800/60',       sign: '−', category: 'External' },
  OPENING_STOCK:  { label: 'Opening Stock',  icon: ArrowDownCircle,  color: 'text-slate-600',   bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',       sign: '+', category: 'Internal' },
};

export default function StockMovementsPageClient() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { business } = useBusinessData();
  const isTrading = business?.businessType?.toLowerCase() === 'trading';
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';
  
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const productIdParam = searchParams.get('productId');

  const fetchData = useCallback(async () => {
    if (!businessId) return;
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (productIdParam) params.productId = productIdParam;
      
      const r = await stockAPI.getMovements(businessId, params);
      setMovements(r.movements || []);
    } catch {
      toast({ title: 'Failed to load movements', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [businessId, productIdParam, toast]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const filtered = useMemo(() => {
    return movements.filter(m => {
      const term = search.toLowerCase();
      const matchSearch = !term || 
        (m.product?.name || '').toLowerCase().includes(term) || 
        (m.product?.sku || '').toLowerCase().includes(term) ||
        (m.warehouse?.name || '').toLowerCase().includes(term);
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      
      const config = MOVEMENT_CONFIG[m.type];
      const matchCategory = categoryFilter === 'all' || (config && config.category === categoryFilter);
      
      return matchSearch && matchType && matchCategory;
    });
  }, [movements, search, typeFilter, categoryFilter]);

  const stats = useMemo(() => {
    const total = movements.length;
    const inbound = movements.filter(m => MOVEMENT_CONFIG[m.type]?.sign === '+').length;
    const outbound = movements.filter(m => MOVEMENT_CONFIG[m.type]?.sign === '−' || MOVEMENT_CONFIG[m.type]?.sign === '-').length;
    const internal = movements.filter(m => MOVEMENT_CONFIG[m.type]?.category === 'Internal').length;
    return { total, inbound, outbound, internal };
  }, [movements]);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const headers = ['Date', 'Category', 'Type', 'Product', 'SKU', 'Warehouse', ...(isTrading ? ['Location'] : []), 'Quantity', 'Reference', 'Performed By'];
    const csvContent = [
      headers.join(','),
      ...filtered.map(m => {
        const config = MOVEMENT_CONFIG[m.type] || { category: 'Internal' };
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
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Stock_Movements_${new Date().toISOString().split('T')[0]}.csv`);
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
              Stock Movements
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Complete audit trail of all inventory changes, adjustments, and transfers.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {productIdParam && (
            <Button variant="ghost" size="sm" className="gap-2 rounded-xl text-muted-foreground hover:text-foreground" onClick={() => navigate(pathname)}>
              <ArrowLeft className="h-4 w-4" /> Clear Filter
            </Button>
          )}
          <Button 
            variant="outline" 
            className="h-10 rounded-xl border-border text-foreground hover:bg-muted font-semibold gap-2 shadow-sm" 
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            <span>Export Audit Log</span>
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
                  Total Movements
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.total}
                </div>
                <p className="text-xs font-medium text-muted-foreground">All logged transactions</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <History className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Inbound Entries
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.inbound}
                </div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Purchases & additions</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                <ArrowDownCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Outbound Entries
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.outbound}
                </div>
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Sales & dispatches</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
                <ArrowUpCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Internal Audits
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.internal}
                </div>
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Transfers & adjustments</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                <ArrowRightLeft className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Filter Notification */}
      {productIdParam && movements.length > 0 && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl">
              <Package className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Filtered by Product</p>
              <p className="text-sm font-bold text-foreground">{movements[0].product?.name} ({movements[0].product?.sku})</p>
            </div>
          </div>
          <Badge className="bg-blue-600 text-white font-bold rounded-lg px-3 py-1">
            {filtered.length} Entries Found
          </Badge>
        </div>
      )}

      {/* Directory Card */}
      <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden flex-1 flex flex-col w-full min-w-0 max-w-full">
        <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-6 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Movement History</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {movements.length} audit logs
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search by product, SKU or warehouse..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="pl-9 h-10 rounded-xl border-border bg-card focus-visible:ring-blue-500 text-sm shadow-sm" 
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl border-border bg-card shadow-sm text-sm font-medium">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Internal & External</SelectItem>
                  <SelectItem value="Internal">Internal Only</SelectItem>
                  <SelectItem value="External">External Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-52 h-10 rounded-xl border-border bg-card shadow-sm text-sm font-medium">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Movement Types</SelectItem>
                  {Object.entries(MOVEMENT_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      <div className="flex items-center gap-2">
                        <v.icon className={cn("size-3.5", v.color)} />
                        <span>{v.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="p-4 bg-muted rounded-full mb-3">
                <History className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-foreground">No movements found</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Try adjusting your search query or movement filters.
              </p>
            </div>
          ) : (
            <Table className="w-full min-w-[950px]">
              <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground pl-6">Timestamp</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Activity Type</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Category</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Product & SKU</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Warehouse</TableHead>
                  {isTrading && (
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Location</TableHead>
                  )}
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Reference</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">User</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {filtered.map(m => {
                  const cfg = MOVEMENT_CONFIG[m.type] || { 
                    label: m.type, 
                    icon: History, 
                    color: 'text-slate-600', 
                    bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', 
                    sign: '', 
                    category: 'Internal' 
                  };
                  const Icon = cfg.icon;
                  const isPositive = cfg.sign === '+';
                  
                  return (
                    <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">{format(new Date(m.createdAt), 'MMM dd, yyyy')}</span>
                          <span className="text-[11px] font-mono text-muted-foreground">{format(new Date(m.createdAt), 'HH:mm:ss')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold", cfg.bg)}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        {cfg.category === 'Internal' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                            <span className="size-1.5 rounded-full bg-indigo-500" />
                            Internal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            External
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div>
                          <p className="text-sm font-bold text-foreground leading-tight">{m.product?.name || 'Unnamed Product'}</p>
                          <p className="text-xs font-mono text-muted-foreground mt-0.5">{m.product?.sku || 'NO-SKU'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-sm font-medium text-foreground">
                        {m.warehouse?.name || '—'}
                      </TableCell>
                      {isTrading && (
                        <TableCell className="py-4 text-sm text-muted-foreground">
                          {m.location ? (m.location.name ? `${m.location.code} - ${m.location.name}` : m.location.code) : '—'}
                        </TableCell>
                      )}
                      <TableCell className="py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-muted text-foreground border border-border">
                          <FileText className="size-3 text-muted-foreground" />
                          {m.referenceType || 'ADJUSTMENT'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-xs font-medium text-muted-foreground">
                        {m.performedBy?.user?.name || 'System'}
                      </TableCell>
                      <TableCell className={cn(
                        "py-4 text-right pr-6 font-black text-sm",
                        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      )}>
                        {cfg.sign}{m.quantity.toLocaleString()}
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
