import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import {  useLocation  } from 'react-router-dom';
import { Layers, Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { categoriesAPI, Category } from '@/lib/api/inventory'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function CategoriesPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ id: '', name: '', description: '', parentId: '' })

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try { setIsLoading(true); const r = await categoriesAPI.getAll(businessId); setCategories(r.categories || []) }
    catch { toast({ title: 'Failed to load categories', variant: 'destructive' }) }
    finally { setIsLoading(false) }
  }, [businessId])
  useEffect(() => { fetchData() }, [fetchData])

  const filtered = categories.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))

  const openCreate = () => { setForm({ id: '', name: '', description: '', parentId: '' }); setDialogOpen(true) }
  const openEdit = (c: Category) => { setForm({ id: c.id, name: c.name, description: c.description || '', parentId: c.parentId || '' }); setDialogOpen(true) }

  const handleSave = async () => {
    try {
      if (form.id) {
        await categoriesAPI.update(businessId, form.id, { name: form.name, description: form.description, parentId: form.parentId || undefined })
        toast({ title: 'Category updated' })
      } else {
        await categoriesAPI.create(businessId, { name: form.name, description: form.description, parentId: form.parentId || undefined })
        toast({ title: 'Category created' })
      }
      setDialogOpen(false); fetchData()
    } catch { toast({ title: 'Failed to save category', variant: 'destructive' }) }
  }

  const handleDelete = async (id: string) => {
    try { await categoriesAPI.delete(businessId, id); toast({ title: 'Category deleted' }); fetchData() }
    catch { toast({ title: 'Failed to delete', variant: 'destructive' }) }
    finally { setDeleteId(null) }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize your products into categories</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" />New Category</Button>
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search categories…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Layers className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">No categories yet. Create your first one.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-4">Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow key={c.id} className="hover:bg-muted/20">
                      <TableCell className="pl-4 font-medium text-sm">{c.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.description || '—'}</TableCell>
                      <TableCell className="text-sm">{c.parent?.name || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></TableCell>
                      <TableCell className="pr-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? 'Edit Category' : 'New Category'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" className="mt-1" /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" className="mt-1" /></div>
            <div><Label>Parent Category</Label>
              <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
                <option value="">None (Top Level)</option>
                {categories.filter(c => c.id !== form.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{form.id ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteId && handleDelete(deleteId)}>Delete</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
