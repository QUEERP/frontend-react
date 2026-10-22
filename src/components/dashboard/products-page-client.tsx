import { toast } from 'sonner';
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Search, Filter, MoreVertical, Download, Package, CheckCircle2, Layers, Tag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  igstPercent?: number;
  sgstPercent?: number;
  cgstPercent?: number;
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  costPrice: number;
  type: string;       // GOODS / SERVICE
  taxCode?: string;    // HSN or SAC
  taxPercent: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  stock?: any[];
}

export default function ProductsPageClient() {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { toast } = useToast();
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const API_BASE = (import.meta.env.VITE_API_BASE || '').trim();
  const API_ROOT = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

  const getCookie = useCallback((name: string) => {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\\^$|?*+()[\]{}.])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = getCookie('token') || getCookie('accessToken');
      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to load products.',
          variant: 'destructive',
        });
        return;
      }

      if (!businessId) {
        throw new Error('Business context not found.');
      }

      const response = await fetch(`${API_ROOT}/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || `Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Failed to load products',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [API_ROOT, businessId, getCookie]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (product: Product) => {
    try {
      const token = getCookie('token') || getCookie('accessToken');
      if (!token) return;

      if (!businessId) {
        throw new Error('Business context not found.');
      }

      const response = await fetch(`${API_ROOT}/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || 'Failed to delete product');
      }

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast({
        title: 'Success',
        description: 'Product deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product.',
        variant: 'destructive',
      });
    }
  };

  const downloadReport = () => {
    if (products.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const headers = ['Name', 'SKU', 'Type', 'HSN/SAC', 'Unit', 'Cost Price', 'Selling Price', 'Tax %', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => [
        `"${p.name}"`,
        `"${p.sku}"`,
        `"${p.type}"`,
        `"${p.taxCode || ''}"`,
        `"${p.unit}"`,
        p.costPrice,
        p.price,
        p.taxPercent,
        p.isActive ? 'Active' : 'Inactive',
        new Date(p.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Products_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Report downloaded successfully' });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Products
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Manage your product catalog and inventory.
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
          <Link to={`/dashboard/${businessId}/products/add`}>
            <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm gap-2">
              <Plus className="h-4 w-4" />
              <span>New Product</span>
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
                  Total Products
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : products.length}
                </div>
                <p className="text-xs font-medium text-muted-foreground">All catalog items</p>
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
                  Active Items
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : products.filter(p => p.isActive).length}
                </div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Available in sales</p>
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
                  Physical Goods
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : products.filter(p => p.type === 'GOODS').length}
                </div>
                <p className="text-xs font-medium text-muted-foreground">Stock-tracked items</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                <Layers className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Services
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : products.filter(p => p.type === 'SERVICE').length}
                </div>
                <p className="text-xs font-medium text-muted-foreground">Service offerings</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
                <Tag className="h-6 w-6" />
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
              <CardTitle className="text-lg font-bold text-foreground">Directory</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                Showing <span className="text-foreground font-semibold">{filteredProducts.length}</span> of {products.length} products
              </CardDescription>
            </div>
            
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 rounded-xl border-border bg-card focus-visible:ring-blue-500 text-sm shadow-sm"
              />
            </div>
          </div>
        </CardHeader>
        
        <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="p-4 bg-muted rounded-full mb-3">
                <Package className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-foreground">No products found</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mb-4">
                {searchTerm ? 'No products match your search criteria.' : 'Get started by creating your first product.'}
              </p>
              {!searchTerm && (
                <Link to={`/dashboard/${businessId}/products/add`}>
                  <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create First Product
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table className="w-full min-w-[950px]">
              <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground pl-6">Name</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">SKU</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">HSN/SAC</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Unit</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Stock</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Cost Price</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Selling Price</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tax %</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow 
                    key={product.id}
                    className="group hover:bg-muted/50 border-b border-border transition-colors cursor-pointer"
                    onClick={() => navigate(`/dashboard/${businessId}/products/${product.id}`)}
                  >
                    <TableCell className="pl-6 py-4 font-semibold text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline">
                      {product.name}
                    </TableCell>
                    <TableCell className="py-4 font-mono text-xs font-semibold text-muted-foreground">{product.sku}</TableCell>
                    <TableCell className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        product.type === 'GOODS'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {product.type === 'GOODS' ? 'Goods' : product.type === 'SERVICE' ? 'Service' : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-sm text-muted-foreground">{product.taxCode || '—'}</TableCell>
                    <TableCell className="py-4 text-sm font-medium">{product.unit}</TableCell>
                    <TableCell className="py-4 text-sm font-bold text-foreground">
                      {product.type === 'GOODS' ? (product.stock?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0) : '—'}
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium text-muted-foreground">${product.costPrice.toFixed(2)}</TableCell>
                    <TableCell className="py-4 text-sm font-bold text-foreground">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="py-4 text-sm font-medium">{product.taxPercent}%</TableCell>
                    <TableCell className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        product.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg cursor-pointer text-slate-400 hover:text-foreground hover:bg-muted">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border bg-card">
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/${businessId}/products/${product.id}`} className="flex items-center gap-2 cursor-pointer py-2.5">
                              <Eye className="h-4 w-4 text-blue-600" />
                              <span>View Product</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/${businessId}/products/${product.id}/edit`} className="flex items-center gap-2 cursor-pointer py-2.5">
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                              <span>Edit Product</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-rose-600 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-500/10 cursor-pointer py-2.5"
                            onClick={() => {
                              setSelectedProduct(product);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Product</span>
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
        {filteredProducts.length > 0 && (
          <div className="border-t border-border px-6 py-4">
            <p className="text-xs font-medium text-muted-foreground">Showing <span className="font-bold text-foreground">{filteredProducts.length}</span> of {products.length} products</p>
          </div>
        )}
      </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {selectedProduct?.name}? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedProduct && handleDeleteProduct(selectedProduct)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
