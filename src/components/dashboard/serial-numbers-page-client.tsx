import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import {  useLocation  } from 'react-router-dom';
import { ScanLine, Search } from 'lucide-react'
import { stockAPI, SerialNumber } from '@/lib/api/inventory'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const SERIAL_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800',
  SOLD: 'bg-indigo-100 text-indigo-800',
  RESERVED: 'bg-amber-100 text-amber-800',
  DAMAGED: 'bg-red-100 text-red-700',
  RETURNED: 'bg-violet-100 text-violet-800',
}

export default function SerialNumbersPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
  const [serials, setSerials] = useState<SerialNumber[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try { setIsLoading(true); const r = await stockAPI.getSerials(businessId); setSerials(r.serials || []) }
    catch { toast({ title: 'Failed to load serial numbers', variant: 'destructive' }) }
    finally { setIsLoading(false) }
  }, [businessId])
  useEffect(() => { fetchData() }, [fetchData])

  const filtered = serials.filter(s => {
    const term = search.toLowerCase()
    const matchSearch = !term || s.serialNumber.toLowerCase().includes(term) || (s.product?.name || '').toLowerCase().includes(term)
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Serial Numbers</h1>
        <p className="text-sm text-muted-foreground">Track individual units by unique serial numbers</p>
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search serial or product…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.keys(SERIAL_STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <ScanLine className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">No serial numbers found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-4">Serial Number</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(s => (
                    <TableRow key={s.id} className="hover:bg-muted/20">
                      <TableCell className="pl-4 font-mono font-semibold text-sm">{s.serialNumber}</TableCell>
                      <TableCell className="text-sm font-medium">{s.product?.name || '—'}</TableCell>
                      <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SERIAL_STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-700'}`}>{s.status}</span></TableCell>
                      <TableCell className="pr-4 text-sm text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          {filtered.length > 0 && <div className="border-t px-4 py-3"><p className="text-xs text-muted-foreground">{filtered.length} of {serials.length} serials</p></div>}
        </CardContent>
      </Card>
    </div>
  )
}
