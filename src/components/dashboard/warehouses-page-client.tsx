import { toast } from 'sonner';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {  useLocation  } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Search, Filter, MapPin, MoreHorizontal, Download } from 'lucide-react';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { warehousesAPI, Warehouse } from '@/lib/api/warehouses';

export default function WarehousesPageClient() {
  const pathname = useLocation().pathname;
  const { toast } = useToast();
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  const fetchWarehouses = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!businessId) {
        toast({
          title: 'Error',
          description: 'Business ID not found.',
          variant: 'destructive',
        });
        return;
      }

      const response = await warehousesAPI.getWarehouses(businessId);
      if (response.success && Array.isArray(response.warehouses)) {
        setWarehouses(response.warehouses);
      } else {
        setWarehouses([]);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast({
        title: 'Failed to load warehouses',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setWarehouses([]);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, toast]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleDeleteWarehouse = async (warehouse: Warehouse) => {
    try {
      await warehousesAPI.deleteWarehouse(businessId, warehouse.id);
      setWarehouses(warehouses.filter(w => w.id !== warehouse.id));
      toast({
        title: 'Success',
        description: 'Warehouse deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete warehouse.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedWarehouse(null);
    }
  };

  const downloadReport = () => {
    if (warehouses.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const headers = ['Name', 'Address', 'City', 'Country', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...warehouses.map(w => [
        `"${w.name}"`,
        `"${w.address || ''}"`,
        `"${w.city || ''}"`,
        `"${w.country || ''}"`,
        w.isActive ? 'Active' : 'Inactive',
        new Date(w.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Warehouses_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Report downloaded successfully' });
  };

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Warehouses</h1>
          <p className="text-muted-foreground mt-1">Manage your warehouse locations</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={downloadReport} className="gap-2">
            <Download className="h-4 w-4" />
            Download Reports
          </Button>
          <Link to={`/dashboard/${businessId}/warehouses/add`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Warehouse
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredWarehouses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No warehouses found. Create your first warehouse to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-medium">{warehouse.name}</TableCell>
                    <TableCell>{warehouse.address || '-'}</TableCell>
                    <TableCell>{warehouse.city || '-'}</TableCell>
                    <TableCell>{warehouse.country || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        warehouse.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {warehouse.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/${businessId}/warehouses/${warehouse.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/${businessId}/warehouses/${warehouse.id}/edit`}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedWarehouse(warehouse);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
          <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {selectedWarehouse?.name}? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedWarehouse && handleDeleteWarehouse(selectedWarehouse)}
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
