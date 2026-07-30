import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import {  useLocation  } from 'react-router-dom';
import { Ruler, Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { unitsAPI, Unit } from '@/lib/api/inventory'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function UnitsPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ id: '', name: '', abbreviation: '' })

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try { setIsLoading(true); const r = await unitsAPI.getAll(businessId); setUnits(r.units || []) }
    catch { toast({ title: 'Failed to load units', variant: 'destructive' }) }
    finally { setIsLoading(false) }
  }, [businessId, toast])
  useEffect(() => { fetchData() }, [fetchData])

  const filtered = units.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.abbreviation.toLowerCase().includes(search.toLowerCase()))

  const handleSave = async () => {
    try {
      if (form.id) { await unitsAPI.update(businessId, form.id, { name: form.name, abbreviation: form.abbreviation }); toast({ title: 'Unit updated' }) }
      else { await unitsAPI.create(businessId, { name: form.name, abbreviation: form.abbreviation }); toast({ title: 'Unit created' }) }
      setDialogOpen(false); fetchData()
    } catch { toast({ title: 'Failed to save unit', variant: 'destructive' }) }
  }

  const handleDelete = async (id: string) => {
    try { await unitsAPI.delete(businessId, id); toast({ title: 'Unit deleted' }); fetchData() }
    catch { toast({ title: 'Failed to delete', variant: 'destructive' }) }
    finally { setDeleteId(null) }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Units of Measure</h1>
          <p className="text-sm text-muted-foreground">Define measurement units for products (kg, pcs, litre…)</p>
        </div>
        <Button className="gap-2" onClick={() => { setForm({ id: '', name: '', abbreviation: '' }); setDialogOpen(true) }}><Plus className="h-4 w-4" />New Unit</Button>
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search units…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Ruler className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">No units defined yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-4">Name</TableHead>
                    <TableHead>Abbreviation</TableHead>
                    <TableHead className="pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(u => (
                    <TableRow key={u.id} className="hover:bg-muted/20">
                      <TableCell className="pl-4 font-medium text-sm">{u.name}</TableCell>
                      <TableCell><span className="rounded-md bg-indigo-100 text-indigo-800 px-2 py-0.5 text-xs font-mono font-medium">{u.abbreviation}</span></TableCell>
                      <TableCell className="pr-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setForm({ id: u.id, name: u.name, abbreviation: u.abbreviation }); setDialogOpen(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => setDeleteId(u.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{form.id ? 'Edit Unit' : 'New Unit'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Kilogram" className="mt-1" /></div>
            <div><Label>Abbreviation *</Label><Input value={form.abbreviation} onChange={e => setForm(f => ({ ...f, abbreviation: e.target.value }))} placeholder="e.g. kg" className="mt-1" /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>{form.id ? 'Update' : 'Create'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Unit</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteId && handleDelete(deleteId)}>Delete</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
