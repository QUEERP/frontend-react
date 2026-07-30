import { toast } from 'sonner';
import React, { useEffect, useState, useCallback } from 'react'
import {  useNavigate  } from 'react-router-dom';
import {
  Loader2Icon,
  PlusIcon,
  StoreIcon,
  SearchIcon,
  TrashIcon,
  EditIcon,
  FileDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { useToast } from '@/components/ui/use-toast'
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton'
import { exportToExcel } from '@/lib/export-utils'
import { getCurrencySymbol } from '@/lib/currencies'

type VendorItem = {
  id: string
  vendorCode: string
  name: string
  vendorType: string
  contactPerson: string
  email: string
  countryCode: string
  phone: string
  taxRegistrationNumber: string
  paymentTerms: string
  currency: string
  openingBalance: number
  balance: number
  creditLimit: number
  preferredVendor: boolean
  status: string
  notes: string
  createdAt: string
}

export function VendorPageClient({ businessId }: { businessId: string }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { business, loading: businessLoading, currencySymbol } = useBusinessData()

  const [vendorList, setVendorList] = useState<VendorItem[]>([])
  const [pageLoading, setPageLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Server-side pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const PAGE_LIMIT = 10

  // Filters
  const [filterType, setFilterType] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  const [exporting, setExporting] = useState(false)

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

  const getCookie = useCallback((name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'),
    )
    return match ? decodeURIComponent(match[1]) : ''
  }, [])

  const fetchData = useCallback(async () => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    setPageLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(currentPage))
      params.append('limit', String(PAGE_LIMIT))
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (filterType !== 'ALL') params.append('vendorType', filterType)
      if (filterStatus !== 'ALL') params.append('status', filterStatus)

      const res = await fetch(`${API_BASE}/api/purchase/vendors?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to load vendors')
      }

      setVendorList(data.vendors || [])
      setTotalPages(data.totalPages || 1)
      setTotalRecords(data.total || 0)
    } catch (err: any) {
      toast({
        title: 'Failed to load vendors',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setPageLoading(false)
    }
  }, [API_BASE, businessId, getCookie, toast, currentPage, searchTerm, filterType, filterStatus])

  useEffect(() => {
    if (!businessLoading) {
      fetchData()
    }
  }, [businessLoading, fetchData])

  // Reset pagination on search/filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, filterStatus])

  const taxLabel = business?.region?.toUpperCase() === 'INDIA' ? 'GSTIN' : business?.region?.toUpperCase() === 'UAE' ? 'TRN' : 'Tax Registration Number'

  const handleOpenCreate = () => {
    navigate(`/dashboard/${businessId}/vendors/create`)
  }

  const handleOpenEdit = (item: VendorItem) => {
    navigate(`/dashboard/${businessId}/vendors/${item.id}/edit`)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/purchase/vendors/${encodeURIComponent(deleteId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to delete vendor')
      }

      toast({ title: 'Vendor deleted', description: 'Vendor has been removed.' })
      fetchData()
    } catch (err: any) {
      toast({
        title: 'Delete failed',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const handleExport = async () => {
    if (vendorList.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' })
      return
    }
    setExporting(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const params = new URLSearchParams()
      params.append('page', '1')
      params.append('limit', '10000')
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (filterType !== 'ALL') params.append('vendorType', filterType)
      if (filterStatus !== 'ALL') params.append('status', filterStatus)

      const res = await fetch(`${API_BASE}/api/purchase/vendors?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Export failed')

      const exportData = (data.vendors || []).map((v: VendorItem) => ({
        'Vendor Code': v.vendorCode || '-',
        'Vendor Name': v.name,
        'Type': v.vendorType || '-',
        'Contact Person': v.contactPerson || '-',
        'Email': v.email || '-',
        'Phone': v.phone ? `${v.countryCode || ''} ${v.phone}`.trim() : '-',
        [taxLabel]: v.taxRegistrationNumber || '-',
        'Currency': v.currency || business?.currency || '-',
        'Balance': v.balance || 0,
        'Status': v.status,
      }))

      exportToExcel(exportData, `Vendors_Report_${new Date().toISOString().split('T')[0]}`, 'Vendors')
      toast({ title: 'Report exported successfully' })
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  if (businessLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm transition-colors">
        <div className="flex min-w-0 items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl hidden sm:block">
            <StoreIcon className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold text-foreground tracking-tight">Vendors</span>
            <span className="text-sm font-medium text-muted-foreground mt-0.5">Manage procurement and supplier accounts</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} disabled={exporting || pageLoading} className="h-10 rounded-xl border-border bg-card hover:bg-muted text-foreground font-semibold gap-2 shadow-sm transition-colors">
            {exporting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <FileDownIcon className="h-4 w-4 text-emerald-600" />}
            Export
          </Button>
          <Button onClick={handleOpenCreate} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm transition-colors">
            <PlusIcon className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-6 border-b border-border bg-muted/50 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          <div className="relative w-full xl:w-80">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, code, email, phone..."
              className="pl-9 h-10 rounded-xl border-border bg-card focus-visible:ring-blue-500 shadow-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl border-border bg-card shadow-sm">
                <SelectValue placeholder="Vendor Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="Supplier">Supplier</SelectItem>
                <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                <SelectItem value="Service Provider">Service Provider</SelectItem>
                <SelectItem value="Contractor">Contractor</SelectItem>
                <SelectItem value="Freelancer">Freelancer</SelectItem>
                <SelectItem value="Transporter">Transporter</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-10 rounded-xl border-border bg-card shadow-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-0 border-t-0 flex-1 overflow-auto custom-scrollbar">
          {pageLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : vendorList.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <StoreIcon className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-foreground">No vendors found</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                {searchTerm || filterType !== 'ALL' || filterStatus !== 'ALL' ? 'Try adjusting your search or filters.' : 'Click "Add Vendor" to create your first supplier profile.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/80 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow className="hover:bg-background border-border">
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-6">Vendor Details</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4">Contact Info</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4">Type</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 text-right">Balance</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 text-center">Status</TableHead>
                  <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorList.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className="hover:bg-muted/50 border-border transition-colors cursor-pointer"
                    onClick={() => handleOpenEdit(item)}
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground flex items-center gap-2">
                          {item.name}
                          {item.preferredVendor && <Badge variant="secondary" className="h-5 text-[10px] bg-amber-100 text-amber-800 border-amber-200">Preferred</Badge>}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground mt-0.5">{item.vendorCode || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex flex-col">
                        {item.email && <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]" title={item.email}>{item.email}</span>}
                        {item.phone && <span className="text-xs font-medium text-muted-foreground mt-0.5">{item.countryCode} {item.phone}</span>}
                        {!item.email && !item.phone && <span className="text-sm text-slate-400">-</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm font-medium text-muted-foreground">
                      {item.vendorType || '-'}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-bold text-sm ${item.balance > 0 ? 'text-rose-600' : 'text-foreground'}`}>
                          {item.currency ? getCurrencySymbol(item.currency) : currencySymbol} {Number(item.balance || 0).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <Badge variant="outline" className={`font-bold text-[10px] uppercase tracking-wide border-transparent ${item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${businessId}/vendors/${item.id}`); }} 
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }} 
                          className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }} 
                          className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/50 mt-auto">
            <p className="text-sm text-muted-foreground font-medium">
              Showing <span className="font-bold text-foreground">{(currentPage - 1) * PAGE_LIMIT + 1}</span> to <span className="font-bold text-foreground">{Math.min(currentPage * PAGE_LIMIT, totalRecords)}</span> of <span className="font-bold text-foreground">{totalRecords}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg border-border bg-card" disabled={currentPage <= 1 || pageLoading} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeftIcon className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg border-border bg-card" disabled={currentPage >= totalPages || pageLoading} onClick={() => setCurrentPage(p => p + 1)}>
                Next <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl bg-card border-border">
          <AlertDialogTitle className="text-foreground">Delete Vendor</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Are you sure you want to delete this vendor? This action cannot be undone and will fail if the vendor has active transactions.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end mt-4">
            <AlertDialogCancel className="rounded-xl border-border m-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="rounded-xl bg-red-600 hover:bg-red-700 text-white m-0 gap-2">
              {deleting && <Loader2Icon className="size-4 animate-spin" />} Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}