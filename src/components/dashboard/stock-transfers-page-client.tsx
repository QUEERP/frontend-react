import { toast } from 'sonner';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  ArrowRightLeft, 
  Search, 
  Plus, 
  CheckCircle, 
  Clock, 
  MoreVertical, 
  Eye, 
  Trash2, 
  Loader2, 
  Edit2, 
  CheckCircle2, 
  Truck, 
  Download 
} from 'lucide-react';
import { stockAPI, StockTransfer } from '@/lib/api/inventory';
import { useToast } from '@/components/ui/use-toast';
import { useBusinessData } from './business-data-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function StockTransfersPageClient() {
  const pathname = useLocation().pathname;
  const { toast } = useToast();
  const { business } = useBusinessData();
  const isTrading = business?.businessType?.toLowerCase() === 'trading';
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!businessId) return;
    try { 
      setIsLoading(true); 
      const r = await stockAPI.getTransfers(businessId); 
      setTransfers(r.transfers || []); 
    }
    catch { 
      toast({ title: 'Failed to load transfers', variant: 'destructive' }); 
    }
    finally { 
      setIsLoading(false); 
    }
  }, [businessId, toast]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await stockAPI.updateTransferStatus(businessId, id, newStatus);
      toast({ title: 'Transfer status updated to ' + newStatus });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Failed to update status', description: error?.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await stockAPI.deleteTransfer(businessId, id);
      toast({ title: 'Transfer deleted successfully' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Failed to delete', description: error?.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const downloadReport = () => {
    if (transfers.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const headers = ['Transfer #', 'From Warehouse', 'To Warehouse', 'Items Count', 'Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...transfers.map(t => [
        `"${t.transferNumber}"`,
        `"${t.fromWarehouse?.name || ''}"`,
        `"${t.toWarehouse?.name || ''}"`,
        t.items?.length || 0,
        t.status,
        new Date(t.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Stock_Transfers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Report downloaded successfully' });
  };

  const filtered = useMemo(() => {
    return transfers.filter(t => 
      !search || 
      t.transferNumber.toLowerCase().includes(search.toLowerCase()) || 
      (t.fromWarehouse?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.toWarehouse?.name || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [transfers, search]);

  const stats = useMemo(() => {
    return {
      total: transfers.length,
      completed: transfers.filter(t => t.status === 'COMPLETED').length,
      pending: transfers.filter(t => t.status === 'PENDING').length,
      inTransit: transfers.filter(t => t.status === 'IN_TRANSIT' || t.status === 'SHIPPED').length,
    };
  }, [transfers]);

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Stock Transfers
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Move inventory between warehouses and track transit status.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={downloadReport} 
            className="h-10 rounded-xl border-border text-foreground hover:bg-muted font-semibold gap-2 shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Link to={`/dashboard/${businessId}/stock-transfers/new`}>
            <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm gap-2">
              <Plus className="h-4 w-4" />
              <span>New Transfer</span>
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
                  Total Transfers
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.total}
                </div>
                <p className="text-xs font-medium text-muted-foreground">All logged movements</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <ArrowRightLeft className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Completed
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.completed}
                </div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Successfully received</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Pending
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.pending}
                </div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Awaiting processing</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  In Transit
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.inTransit}
                </div>
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">En route to location</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                <Truck className="h-6 w-6" />
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
              <CardTitle className="text-lg font-bold text-foreground">Transfers Directory</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {transfers.length} transfers
              </CardDescription>
            </div>
            
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search transfer # or warehouse..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl border-border bg-card focus-visible:ring-blue-500 text-sm shadow-sm"
              />
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
                <ArrowRightLeft className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-foreground">No stock transfers found</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mb-4">
                {search ? 'No transfers match your search criteria.' : 'Get started by creating your first warehouse stock transfer.'}
              </p>
              {!search && (
                <Link to={`/dashboard/${businessId}/stock-transfers/new`}>
                  <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create First Transfer
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table className="w-full min-w-[850px]">
              <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground pl-6">Transfer #</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">From</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">To</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Items</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {filtered.map(t => (
                  <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="pl-6 py-4 font-mono font-bold text-sm text-foreground">
                      {t.transferNumber}
                    </TableCell>
                    <TableCell className="py-4 text-sm">
                      <div className="font-semibold text-foreground">{t.fromWarehouse?.name || '—'}</div>
                      {isTrading && t.fromLocation && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Loc: {t.fromLocation.name ? `${t.fromLocation.code} - ${t.fromLocation.name}` : t.fromLocation.code}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-sm">
                      <div className="font-semibold text-foreground">{t.toWarehouse?.name || '—'}</div>
                      {isTrading && t.toLocation && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Loc: {t.toLocation.name ? `${t.toLocation.code} - ${t.toLocation.name}` : t.toLocation.code}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-muted text-foreground">
                        {t.items?.length || 0}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      {t.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          COMPLETED
                        </span>
                      ) : t.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                          <span className="size-1.5 rounded-full bg-amber-500" />
                          PENDING
                        </span>
                      ) : t.status === 'SHIPPED' || t.status === 'IN_TRANSIT' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                          <span className="size-1.5 rounded-full bg-indigo-500" />
                          {t.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {t.status}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-sm text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {t.status === 'PENDING' && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(t.id, 'SHIPPED')} className="flex items-center gap-2 text-indigo-600 cursor-pointer">
                                <Truck className="h-4 w-4" />
                                Mark as Shipped
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(t.id, 'COMPLETED')} className="flex items-center gap-2 text-emerald-600 cursor-pointer">
                                <CheckCircle2 className="h-4 w-4" />
                                Approve & Receive
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/dashboard/${businessId}/stock-transfers/${t.id}/edit`} className="flex items-center gap-2 cursor-pointer">
                                  <Edit2 className="h-4 w-4 text-amber-600" />
                                  Edit Transfer
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {t.status === 'SHIPPED' && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(t.id, 'COMPLETED')} className="flex items-center gap-2 text-emerald-600 cursor-pointer">
                                <CheckCircle2 className="h-4 w-4" />
                                Mark as Received
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/${businessId}/stock-transfers/${t.id}`} className="flex items-center gap-2 cursor-pointer">
                              <Eye className="h-4 w-4 text-blue-600" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
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
        </div>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogTitle>Delete Transfer</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this stock transfer? This will reverse the movement between warehouses. This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
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
  );
}
