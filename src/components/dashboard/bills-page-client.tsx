import { toast } from 'sonner';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {  useLocation  } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Search, Filter, FileText, Download, MoreVertical, ReceiptIcon } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Bill {
  id: string;
  billNumber: string;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  vendorId: string;
  totalAmount: number;
  vendor?: { name: string };
  billDate: string;
  dueDate: string;
  createdAt: string;
}

export default function BillsPageClient() {
  const pathname = useLocation().pathname;
  const { toast } = useToast();
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';

  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const API_BASE = (import.meta.env.VITE_API_BASE || '').trim();
  const API_ROOT = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

  const getCookie = useCallback((name: string) => {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\\^$|?*+()[\]{}.])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }, []);

  const fetchBills = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = getCookie('token') || getCookie('accessToken');
      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to load bills.',
          variant: 'destructive',
        });
        return;
      }

      if (!businessId) {
        throw new Error('Business context not found.');
      }

      const response = await fetch(`${API_ROOT}/bills`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || `Failed to fetch bills: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.bills)) {
        setBills(data.bills);
      } else {
        setBills([]);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: 'Failed to load bills',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [API_ROOT, businessId, getCookie]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleDeleteBill = async (bill: Bill) => {
    try {
      const token = getCookie('token') || getCookie('accessToken');
      if (!token) return;

      const response = await fetch(`${API_ROOT}/bills/${bill.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || 'Failed to delete bill');
      }

      setBills((prev) => prev.filter((b) => b.id !== bill.id));
      toast({
        title: 'Success',
        description: 'Bill deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete bill.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedBill(null);
    }
  };

  const filteredBills = bills.filter(bill =>
    bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bill.vendor?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const getStatusColor = (status: Bill['status']) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PARTIALLY_PAID':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNPAID':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadReport = () => {
    if (bills.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const headers = ['Bill #', 'Vendor', 'Bill Date', 'Due Date', 'Amount', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...bills.map(b => [
        `"${b.billNumber}"`,
        `"${b.vendor?.name || ''}"`,
        new Date(b.billDate).toLocaleDateString(),
        b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '',
        b.totalAmount,
        `"${b.status}"`,
        new Date(b.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Bills_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Report downloaded successfully' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl shadow-sm border border-primary/20">
            <ReceiptIcon className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Vendor Bills</h1>
            <p className="text-sm text-muted-foreground font-medium">Manage and track your vendor payments and due bills</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={downloadReport} className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
            <Download className="size-4" />
            Export Report
          </Button>
          <Link to={`/dashboard/${businessId}/bills/new`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Bill
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4 pt-6 px-6 bg-muted/30 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by bill number or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-none bg-background shadow-sm rounded-xl"
              />
            </div>
            <Button variant="outline" className="h-11 shadow-sm rounded-xl border-none bg-background">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredBills.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No bills found. Create your first bill to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Bill Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.billNumber}</TableCell>
                    <TableCell>{bill.vendor?.name || 'N/A'}</TableCell>
                    <TableCell>{new Date(bill.billDate).toLocaleDateString()}</TableCell>
                    <TableCell>{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="font-semibold">${bill.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(bill.status)}`}>
                        {bill.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/${businessId}/bills/${bill.id}`} className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/${businessId}/bills/${bill.id}/edit`} className="flex items-center gap-2">
                              <Edit2 className="h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-red-600 focus:text-red-600"
                            onClick={() => {
                              setSelectedBill(bill);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Bill</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete bill {selectedBill?.billNumber}? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedBill && handleDeleteBill(selectedBill)}
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
