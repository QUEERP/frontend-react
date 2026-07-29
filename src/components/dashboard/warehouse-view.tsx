import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import {  useNavigate, useLocation  } from 'react-router-dom';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { warehousesAPI, Warehouse } from '@/lib/api/warehouses';

interface WarehouseViewProps {
  warehouseId: string;
}

export default function WarehouseView({ warehouseId }: WarehouseViewProps) {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { toast } = useToast();
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';

  const [isLoading, setIsLoading] = useState(true);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);

  useEffect(() => {
    fetchWarehouse();
  }, [warehouseId]);

  const fetchWarehouse = async () => {
    try {
      const response = await warehousesAPI.getWarehouse(businessId, warehouseId);
      if (response.success) {
        setWarehouse(response.warehouse);
      }
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load warehouse details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Warehouse Not Found</h1>
            <p className="text-muted-foreground mt-1">The warehouse you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{warehouse.name}</h1>
            <p className="text-muted-foreground mt-1">Warehouse details</p>
          </div>
        </div>
        <Button
          onClick={() => navigate(`/dashboard/${businessId}/warehouses/${warehouseId}/edit`)}
          className="gap-2"
        >
          <Edit2 className="h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Warehouse Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="mt-1 text-lg font-semibold">{warehouse.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    warehouse.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {warehouse.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <p className="mt-1">{warehouse.address || '-'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">City</label>
                <p className="mt-1">{warehouse.city || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Country</label>
                <p className="mt-1">{warehouse.country || '-'}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="mt-1">
                {new Date(warehouse.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
