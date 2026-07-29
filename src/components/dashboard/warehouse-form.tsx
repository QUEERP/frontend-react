import { toast } from 'sonner';
import React, { useState, useEffect, useCallback } from 'react';
import {  useNavigate, useLocation  } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { warehousesAPI, CreateWarehouseData } from '@/lib/api/warehouses';

interface WarehouseFormProps {
  warehouseId?: string;
}

export default function WarehouseForm({ warehouseId }: WarehouseFormProps) {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { toast } = useToast();
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWarehouse, setIsLoadingWarehouse] = useState(!!warehouseId);
  const [formData, setFormData] = useState<CreateWarehouseData>({
    name: '',
    address: '',
    city: '',
    country: '',
    isActive: true,
  });

  useEffect(() => {
    if (warehouseId) {
      fetchWarehouse();
    }
  }, [warehouseId]);

  const fetchWarehouse = async () => {
    try {
      const response = await warehousesAPI.getWarehouse(businessId, warehouseId!);
      if (response.success) {
        const warehouse = response.warehouse;
        setFormData({
          name: warehouse.name,
          address: warehouse.address || '',
          city: warehouse.city || '',
          country: warehouse.country || '',
          isActive: warehouse.isActive,
        });
      }
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load warehouse details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingWarehouse(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      if (warehouseId) {
        await warehousesAPI.updateWarehouse(businessId, warehouseId, formData);
        toast({
          title: 'Success',
          description: 'Warehouse updated successfully.',
        });
      } else {
        await warehousesAPI.createWarehouse(businessId, formData);
        toast({
          title: 'Success',
          description: 'Warehouse created successfully.',
        });
      }

      navigate(`/dashboard/${businessId}/warehouses`);
    } catch (error) {
      console.error('Error saving warehouse:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save warehouse.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingWarehouse) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">{warehouseId ? 'Edit Warehouse' : 'Create New Warehouse'}</h1>
          <p className="text-muted-foreground mt-1">Fill in the details to {warehouseId ? 'update' : 'create'} a warehouse</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Warehouse Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Warehouse Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Warehouse Name *</label>
                <Input
                  placeholder="e.g., Main Warehouse"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  placeholder="Street address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input
                    placeholder="City"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Country</label>
                  <Select value={formData.country || ''} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UAE">United Arab Emirates</SelectItem>
                      <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                      <SelectItem value="Qatar">Qatar</SelectItem>
                      <SelectItem value="Kuwait">Kuwait</SelectItem>
                      <SelectItem value="Oman">Oman</SelectItem>
                      <SelectItem value="Bahrain">Bahrain</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive || false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Warehouse'}
          </Button>
        </div>
      </form>
    </div>
  );
}
