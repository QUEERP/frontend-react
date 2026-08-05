import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom';
import {  useNavigate  } from 'react-router-dom';
import {
  BellIcon,
  Building2Icon,
  FlameIcon,
  LineChartIcon,
  SearchIcon,
  TrendingUpIcon,
  UserIcon,
  UsersIcon,
  PlusIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  DollarSignIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { useToast } from '@/components/ui/use-toast'
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserMenu } from './user-menu'

export function CustomersPageClient({ businessId }: { businessId: string }) {
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const navigate = useNavigate()
  const { business, loading, refresh, currencySymbol } = useBusinessData()
  const { toast } = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isBusinessInactiveDialogOpen, setIsBusinessInactiveDialogOpen] = useState(false)
  
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<any>(null)
  const [selectedDocIdForPayment, setSelectedDocIdForPayment] = useState<string>('')
  
  const API_BASE = import.meta.env.VITE_API_BASE || ''
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  useEffect(() => {
    const storedName = window.localStorage.getItem('businessName')
    if (storedName) {
      setBusinessName(storedName)
    }
  }, [])

  const displayName = useMemo(() => {
    if (businessName && businessName.trim().length > 0) {
      return businessName
    }
    if (!businessId) {
      return 'Your Business'
    }
    return `Business ${businessId.slice(0, 6).toUpperCase()}`
  }, [businessName, businessId])

  const customers = useMemo(() => {
    return (business?.customers ?? []).map((c: any) => {
      const cInvoices = (business?.invoices ?? []).filter((inv: any) => inv.customerId === c.id);
      const rev = cInvoices.reduce((sum: number, inv: any) => {
        if (inv.status !== 'DRAFT' && inv.status !== 'CANCELLED') {
          return sum + Number(inv.grandTotal || 0);
        }
        return sum;
      }, 0);
      
      let customerCurrency = c.currency && c.currency !== 'SYSTEM' ? c.currency : (business?.currency || 'INR');
      // Safely map common region names if they were accidentally saved as currency
      if (customerCurrency.toUpperCase() === 'CANADA') customerCurrency = 'CAD';
      if (customerCurrency.toUpperCase() === 'INDIA') customerCurrency = 'INR';
      if (customerCurrency.toUpperCase() === 'UAE' || customerCurrency.toUpperCase() === 'DUBAI') customerCurrency = 'AED';
      if (customerCurrency.toUpperCase() === 'USA' || customerCurrency.toUpperCase() === 'US') customerCurrency = 'USD';
      
      const formatCurrency = (amount: number, currency: string) => {
        try {
          return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
          }).format(amount);
        } catch {
          return `${currency} ${amount.toLocaleString('en-IN')}`;
        }
      };

      return {
        id: c.id,
        name: c.company || c.name || '',
        phone: c.phone || '',
        region: c.country || c.region || '',
        address: [c.city, c.country].filter(Boolean).join(', '),
        status: c.isActive ? 'Active' : 'Inactive',
        totalInvoices: cInvoices.length,
        totalRevenue: rev > 0 ? formatCurrency(rev, customerCurrency) : '',
        lastInvoice: cInvoices.length > 0 && cInvoices[0]?.createdAt
          ? new Date(cInvoices[0].createdAt).toISOString().split('T')[0]
          : '',
        joinDate: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '',
        rawRevenue: rev
      };
    })
  }, [business])

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer: any) => {
      const base = `${customer.name} ${customer.phone} ${customer.id}`.toLowerCase()
      const matchesSearch = base.includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [customers, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const totalCustomers = customers.length
    const activeCustomers = customers.filter((c: any) => c.status === 'Active').length
    const overdueCustomers = 0
    const totalRev = customers.reduce((sum: number, c: any) => sum + (c.rawRevenue || 0), 0)
    
    const currency = business?.currency || 'INR';
    const formattedTotalRevenue = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(totalRev);

    return {
      totalCustomers,
      activeCustomers,
      overdueCustomers,
      totalRevenue: formattedTotalRevenue,
    }
  }, [customers, business])

  const isBasic = business?.businessType?.toLowerCase() === 'basic'
  
  const pendingDocs = useMemo(() => {
    if (!selectedCustomerForPayment) return []
    if (isBasic) {
      return (business?.quotations || business?.invoices || []).filter((q: any) => 
        q.customerId === selectedCustomerForPayment.id && 
        q.status !== 'PAID' && 
        q.status !== 'CANCELLED' && 
        q.status !== 'DRAFT'
      )
    }
    return (business?.invoices || []).filter((i: any) => 
      i.customerId === selectedCustomerForPayment.id && 
      i.status !== 'PAID' && 
      i.status !== 'CANCELLED' && 
      i.status !== 'DRAFT'
    )
  }, [selectedCustomerForPayment, business, isBasic])

  const handleAddCustomerClick = () => {
    if (business?.isActive === false) {
      setIsBusinessInactiveDialogOpen(true)
      return
    }
    navigate(`/dashboard/${businessId}/customers/add`)
  }

  const handleContactTeam = () => {
    window.location.href = 'https://www.queinfotech.com/contact'
  }

  if (loading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div className="grid min-h-svh grid-cols-1 content-start gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your customer database and track revenue</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleAddCustomerClick} className="h-10 cursor-pointer gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-xl border-none font-medium px-5">
            <PlusIcon className="h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Customers', value: stats.totalCustomers, icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Active Customers', value: stats.activeCustomers, icon: Building2Icon, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
          { label: 'Overdue Accounts', value: stats.overdueCustomers, icon: BellIcon, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
          { label: 'Total Revenue', value: stats.totalRevenue, icon: TrendingUpIcon, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
        ].map(stat => (
          <Card key={stat.label} className="border-border bg-card shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${stat.bg} ${stat.color} shadow-sm`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content */}
      {/* Main content */}
      <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Customer Directory</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                View and manage all your customers in one place.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-9 rounded-xl border-border bg-card focus-visible:ring-blue-500 h-10 text-sm shadow-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] rounded-xl border-border bg-card h-10 shadow-sm focus:ring-blue-500">
                  <SelectValue placeholder="Status filter" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-lg">
                  <SelectItem value="all" className="cursor-pointer focus:bg-muted">All Status</SelectItem>
                  <SelectItem value="Active" className="cursor-pointer focus:bg-muted">Active</SelectItem>
                  <SelectItem value="Inactive" className="cursor-pointer focus:bg-muted">Inactive</SelectItem>
                  <SelectItem value="Overdue" className="cursor-pointer focus:bg-muted">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                  <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                  <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Region</TableHead>
                  <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact</TableHead>
                  <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</TableHead>
                  <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoices</TableHead>
                  <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue</TableHead>
                  <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Invoice</TableHead>
                  <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredCustomers.map((customer: any) => {
                  return (
                <TableRow 
                  key={customer.id} 
                  className={`group border-b border-border transition-colors ${business?.businessType?.toLowerCase() === 'basic' ? 'cursor-pointer hover:bg-muted/80' : 'hover:bg-muted/80'}`}
                  onClick={() => {
                    if (business?.businessType?.toLowerCase() === 'basic') {
                      navigate(`/dashboard/${businessId}/customers/${customer.id}/edit`)
                    }
                  }}
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-foreground">{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge variant={customer.region === 'INDIA' ? 'default' : customer.region === 'UAE' ? 'secondary' : 'outline'} className="text-[10px] uppercase tracking-wider font-bold shadow-sm">
                      {customer.region ? customer.region.replace(/_/g, ' ') : '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                      <div className="p-1.5 rounded-md bg-muted text-muted-foreground shrink-0"><PhoneIcon className="h-3 w-3" /></div>
                      {customer.phone || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                      <div className="p-1.5 rounded-md bg-muted text-muted-foreground shrink-0"><MapPinIcon className="h-3 w-3" /></div>
                      {customer.address || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm font-semibold text-foreground">
                    {customer.totalInvoices}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm font-bold text-foreground">
                    {customer.totalRevenue || '—'}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge
                      variant={
                        customer.status === 'Active'
                          ? 'secondary'
                          : customer.status === 'Overdue'
                          ? 'destructive'
                          : 'outline'
                      }
                      className={`text-[10px] uppercase tracking-wider font-bold shadow-sm ${customer.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}`}
                    >
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm font-medium text-muted-foreground">
                    {customer.lastInvoice || '—'}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-2 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/dashboard/${businessId}/payments/add?customerId=${customer.id}`)
                        }}
                      >
                        <DollarSignIcon className="size-3 mr-1" />
                        Add Payment
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 transition-opacity">
                            <MoreHorizontalIcon className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl border-border shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild className="cursor-pointer focus:bg-muted text-foreground">
                          <Link to={`/dashboard/${businessId}/customers/${customer.id}/view`}>
                            <EyeIcon className="mr-2 h-4 w-4 text-blue-500" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer focus:bg-muted text-foreground">
                          <Link to={`/dashboard/${businessId}/customers/${customer.id}/edit`}>
                            <EditIcon className="mr-2 h-4 w-4 text-slate-400" />
                            Edit Customer
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer focus:bg-muted text-foreground">
                          <Link to={`/dashboard/${businessId}/customers/${customer.id}/contacts`}>
                            <UsersIcon className="mr-2 h-4 w-4 text-slate-400" />
                            Manage Contacts
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-muted" />
                        <DropdownMenuItem className="cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700 font-medium" onClick={() => setDeleteId(customer.id)}>
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete Customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  </TableCell>
                </TableRow>
              );
              })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Do you really want to delete this customer?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={async () => {
                if (!deleteId) return
                setDeleting(true)
                try {
                  const token = getCookie('token')
                  const res = await fetch(`${API_BASE}/api/customers/${encodeURIComponent(deleteId)}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId },
                  })
                  const data = await res.json()
                  if (!res.ok || !data?.success) {
                    throw new Error(data?.message || 'Failed to delete customer')
                  }
                  toast({
                    title: 'Customer deleted',
                    description: 'The customer has been removed.',
                    variant: 'destructive',
                  })
                  try {
                    await refresh()
                  } catch {}
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
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBusinessInactiveDialogOpen} onOpenChange={setIsBusinessInactiveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Business Inactive</DialogTitle>
            <DialogDescription>
              Please contact the Que Info Tech team.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBusinessInactiveDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleContactTeam}>
              Contact Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
