import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom';
import { Tag, Plus, Search, Pencil, Trash2, Eye, CheckCircle2, Clock } from 'lucide-react'
import { brandsAPI, Brand } from '@/lib/api/inventory'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default function BrandsPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewBrand, setViewBrand] = useState<Brand | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ id: '', name: '', description: '' })

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try { 
      setIsLoading(true); 
      const r = await brandsAPI.getAll(businessId); 
      setBrands(r.brands || []) 
    } catch { 
      toast({ title: 'Failed to load brands', variant: 'destructive' }) 
    } finally { 
      setIsLoading(false) 
    }
  }, [businessId])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = brands.filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()))

  const totalActive = brands.filter(b => b.isActive).length
  const totalInactive = brands.filter(b => !b.isActive).length

  const handleSave = async () => {
    try {
      if (form.id) { 
        await brandsAPI.update(businessId, form.id, { name: form.name, description: form.description }); 
        toast({ title: 'Brand updated' }) 
      } else { 
        await brandsAPI.create(businessId, { name: form.name, description: form.description }); 
        toast({ title: 'Brand created' }) 
      }
      setDialogOpen(false); 
      fetchData()
    } catch { 
      toast({ title: 'Failed to save brand', variant: 'destructive' }) 
    }
  }

  const handleDelete = async (id: string) => {
    try { 
      await brandsAPI.delete(businessId, id); 
      toast({ title: 'Brand deleted' }); 
      fetchData() 
    } catch { 
      toast({ title: 'Failed to delete', variant: 'destructive' }) 
    } finally { 
      setDeleteId(null) 
    }
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Brands
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Manage product brands and manufacturers.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm gap-2"
            onClick={() => { setForm({ id: '', name: '', description: '' }); setDialogOpen(true) }}
          >
            <Plus className="h-4 w-4" />
            <span>New Brand</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total Brands
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : brands.length}
                </div>
                <p className="text-xs font-medium text-muted-foreground">All registered brands</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <Tag className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Active Brands
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : totalActive}
                </div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Available for catalog</p>
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
                  Inactive / Hidden
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : totalInactive}
                </div>
                <p className="text-xs font-medium text-muted-foreground">Archived labels</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
                <Clock className="h-6 w-6" />
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
                Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {brands.length} brands
              </CardDescription>
            </div>
            
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search brands…" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-9 h-10 rounded-xl border-border bg-card focus-visible:ring-blue-500 text-sm shadow-sm" 
              />
            </div>
          </div>
        </CardHeader>
        
        <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="p-4 bg-muted rounded-full">
                <Tag className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-foreground">No brands found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {search ? 'Try adjusting your search query.' : 'Add your first product brand or manufacturer.'}
              </p>
              {!search && (
                <Button 
                  className="mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  onClick={() => { setForm({ id: '', name: '', description: '' }); setDialogOpen(true) }}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Brand
                </Button>
              )}
            </div>
          ) : (
            <Table className="w-full min-w-[650px]">
              <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground pl-6">Name</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Description</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id} className="group hover:bg-muted/50 border-b border-border transition-colors">
                    <TableCell className="pl-6 py-4 font-semibold text-sm">
                      <span 
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer hover:underline"
                        onClick={() => setViewBrand(b)}
                      >
                        {b.name}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-sm text-muted-foreground">{b.description || '—'}</TableCell>
                    <TableCell className="py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${b.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
                          onClick={() => setViewBrand(b)}
                          title="View Brand Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-foreground hover:bg-muted" 
                          onClick={() => { setForm({ id: b.id, name: b.name, description: b.description || '' }); setDialogOpen(true) }}
                          title="Edit Brand"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" 
                          onClick={() => setDeleteId(b.id)}
                          title="Delete Brand"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-border px-6 py-4">
            <p className="text-xs font-medium text-muted-foreground">Showing <span className="font-bold text-foreground">{filtered.length}</span> of {brands.length} brands</p>
          </div>
        )}
      </Card>

      {/* View Brand Modal */}
      <Dialog open={!!viewBrand} onOpenChange={(open) => !open && setViewBrand(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">{viewBrand?.name}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Brand Information</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-4 text-sm">
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${viewBrand?.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                  {viewBrand?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Description</span>
                <p className="text-foreground text-sm font-medium bg-card p-3 rounded-xl border border-border">
                  {viewBrand?.description || 'No description provided for this brand.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" className="rounded-xl border-border" onClick={() => setViewBrand(null)}>Close</Button>
              <Button 
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={() => {
                  if (viewBrand) {
                    const br = viewBrand;
                    setViewBrand(null);
                    setForm({ id: br.id, name: br.name, description: br.description || '' });
                    setDialogOpen(true);
                  }
                }}
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit Brand
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{form.id ? 'Edit Brand' : 'New Brand'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Brand name" className="mt-1 h-10 rounded-xl border-border" />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" className="mt-1 h-10 rounded-xl border-border" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="rounded-xl border-border" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold" onClick={handleSave}>{form.id ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogTitle>Delete Brand</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone. Products linked to this brand may need reclassification.</AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel className="rounded-xl border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white" onClick={() => deleteId && handleDelete(deleteId)}>Delete</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
